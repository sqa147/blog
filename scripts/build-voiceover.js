#!/usr/bin/env node
// scripts/build-voiceover.js
//
// Reads demo-output/voiceover-timeline.json (produced by the Playwright run)
// and the latest .webm Playwright video, generates per-line TTS audio with
// the host OS, and muxes everything into a single narrated MP4 with ffmpeg.
//
// OS TTS:
//   Windows  →  System.Speech (PowerShell, built-in)
//   macOS    →  /usr/bin/say  (built-in)
//   Linux    →  espeak-ng / espeak  (sudo apt install espeak-ng)
//
// Requires ffmpeg on PATH for both audio conversion (macOS) and the final mux.

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'demo-output');
const TIMELINE_PATH = path.join(OUTPUT_DIR, 'voiceover-timeline.json');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const VIDEO_PATH_FILE = path.join(OUTPUT_DIR, 'last-video-path.txt');
const FALLBACK_VIDEO_DIR = path.join(ROOT, 'test-results');
const FINAL_OUT = path.join(OUTPUT_DIR, 'demo-narrated.mp4');

function which(cmd) {
  const probe = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
  try { execSync(probe, { stdio: 'ignore' }); return true; } catch { return false; }
}

function ensureFfmpeg() {
  if (!which('ffmpeg')) {
    console.error('\n[voiceover] ffmpeg is not on PATH. Install it and try again:');
    console.error('   Windows : winget install Gyan.FFmpeg');
    console.error('   macOS   : brew install ffmpeg');
    console.error('   Linux   : sudo apt install ffmpeg');
    process.exit(1);
  }
}

function findVideo() {
  if (fs.existsSync(VIDEO_PATH_FILE)) {
    const p = fs.readFileSync(VIDEO_PATH_FILE, 'utf8').trim();
    if (p && fs.existsSync(p)) return p;
  }
  const candidates = [];
  (function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p);
      else if (f.endsWith('.webm')) candidates.push(p);
    }
  })(FALLBACK_VIDEO_DIR);
  candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0] || null;
}

// ── OS TTS implementations ───────────────────────────────────────────
function ttsWindows(text, outWav) {
  const escaped = text.replace(/'/g, "''");
  const wavPath = outWav.replace(/\\/g, '\\\\');
  const psScript = `
    Add-Type -AssemblyName System.Speech;
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer;
    $s.Rate = 0;
    $s.SetOutputToWaveFile('${wavPath}');
    $s.Speak('${escaped}');
    $s.Dispose();
  `;
  const r = spawnSync('powershell.exe', ['-NoProfile', '-Command', psScript], { stdio: 'pipe' });
  if (r.status !== 0) {
    throw new Error(`SAPI TTS failed: ${(r.stderr || '').toString().trim() || 'unknown error'}`);
  }
}

function ttsMac(text, outWav) {
  const aiff = outWav.replace(/\.wav$/, '.aiff');
  const r1 = spawnSync('say', ['-o', aiff, text], { stdio: 'pipe' });
  if (r1.status !== 0) throw new Error(`say failed: ${(r1.stderr || '').toString()}`);
  const r2 = spawnSync('ffmpeg', ['-y', '-i', aiff, outWav], { stdio: 'pipe' });
  if (r2.status !== 0) throw new Error(`ffmpeg aiff→wav failed: ${(r2.stderr || '').toString()}`);
  try { fs.unlinkSync(aiff); } catch (_) {}
}

function ttsLinux(text, outWav) {
  const bin = which('espeak-ng') ? 'espeak-ng' : (which('espeak') ? 'espeak' : null);
  if (!bin) {
    throw new Error('espeak / espeak-ng not installed. Install: sudo apt install espeak-ng');
  }
  const r = spawnSync(bin, ['-w', outWav, text], { stdio: 'pipe' });
  if (r.status !== 0) throw new Error(`${bin} failed: ${(r.stderr || '').toString()}`);
}

function tts(text, outWav) {
  if (process.platform === 'win32') return ttsWindows(text, outWav);
  if (process.platform === 'darwin') return ttsMac(text, outWav);
  return ttsLinux(text, outWav);
}

// ── Main ─────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(TIMELINE_PATH)) {
    console.error(`[voiceover] Timeline not found at ${TIMELINE_PATH}`);
    console.error('             Run the demo first:  npm run demo');
    process.exit(1);
  }
  ensureFfmpeg();

  const timeline = JSON.parse(fs.readFileSync(TIMELINE_PATH, 'utf8'));
  const entries = timeline.entries || [];
  if (entries.length === 0) {
    console.error('[voiceover] Timeline is empty.');
    process.exit(1);
  }

  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  console.log(`[voiceover] Generating ${entries.length} narration clips on ${process.platform}…`);

  const clips = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const out = path.join(AUDIO_DIR, `narration-${String(i).padStart(3, '0')}.wav`);
    process.stdout.write(`  [${i + 1}/${entries.length}] @${e.time.toFixed(2)}s  "${e.text.slice(0, 70)}"\n`);
    try {
      tts(e.text, out);
      clips.push({ time: e.time, file: out });
    } catch (err) {
      console.error(`     ! TTS failed for clip ${i}: ${err.message}`);
      console.error('       Skipping this line. OS TTS hints:');
      console.error('         Windows  → built-in System.Speech (PowerShell).');
      console.error('         macOS    → built-in /usr/bin/say + ffmpeg.');
      console.error('         Linux    → install espeak-ng (sudo apt install espeak-ng).');
    }
  }

  if (clips.length === 0) {
    console.error('[voiceover] No clips generated. Aborting.');
    process.exit(1);
  }

  const video = findVideo();
  if (!video) {
    console.error('[voiceover] No Playwright .webm video found.');
    console.error(`             Looked at:  ${VIDEO_PATH_FILE}`);
    console.error(`             And under:  ${FALLBACK_VIDEO_DIR}`);
    process.exit(1);
  }
  console.log(`[voiceover] Using video: ${video}`);

  // Build ffmpeg command:
  //   inputs  : video, clip0, clip1, ...
  //   filter  : adelay each clip by its timeline offset, then amix
  const inputArgs = ['-y', '-i', video];
  clips.forEach((c) => inputArgs.push('-i', c.file));

  const filterParts = clips.map((c, i) => {
    const ms = Math.max(0, Math.round(c.time * 1000));
    return `[${i + 1}:a]adelay=${ms}|${ms}[a${i}]`;
  });
  const mixIns = clips.map((_, i) => `[a${i}]`).join('');
  const filter =
    filterParts.join(';') +
    `;${mixIns}amix=inputs=${clips.length}:duration=longest:dropout_transition=0,volume=1.5[aout]`;

  const ffArgs = [
    ...inputArgs,
    '-filter_complex', filter,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-shortest',
    FINAL_OUT,
  ];

  console.log('[voiceover] Running ffmpeg…');
  const ff = spawnSync('ffmpeg', ffArgs, { stdio: 'inherit' });
  if (ff.status !== 0) {
    console.error('[voiceover] ffmpeg failed.');
    process.exit(ff.status || 1);
  }

  console.log(`\n[voiceover] Done → ${FINAL_OUT}\n`);
}

main();
