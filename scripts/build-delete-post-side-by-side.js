#!/usr/bin/env node
// scripts/build-delete-post-side-by-side.js
//
// Finds the latest BEFORE / AFTER recordings produced by the
// "MiniBlog · Delete post · before / after" describe block in
// tests/demo-before-after.spec.js, pads the shorter clip so both end
// together, then hstacks them into demo-output/delete-post-side-by-side.mp4.
//
// The "BEFORE" / "AFTER" banner is already baked into each take (via the
// test's installHeadingBanner) so no ffmpeg drawtext overlay is needed —
// which side-steps the Windows fontconfig dependency.

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'demo-output');
const TEST_RESULTS_DIR = path.join(ROOT, 'test-results');
const FINAL_OUT = path.join(OUTPUT_DIR, 'delete-post-side-by-side.mp4');

function which(cmd) {
  const probe = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`;
  try { execSync(probe, { stdio: 'ignore' }); return true; } catch { return false; }
}

function findVideoByTestTitle(substr) {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    console.error(`[hstack] test-results dir not found: ${TEST_RESULTS_DIR}`);
    process.exit(1);
  }
  const candidates = fs.readdirSync(TEST_RESULTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.includes(substr))
    .map((e) => {
      const dir = path.join(TEST_RESULTS_DIR, e.name);
      const video = path.join(dir, 'video.webm');
      return fs.existsSync(video)
        ? { video, mtime: fs.statSync(video).mtimeMs }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.mtime - a.mtime);
  if (candidates.length === 0) {
    console.error(`[hstack] No test-results dir matched "${substr}" with a video.webm.`);
    console.error('         Run:  npx playwright test tests/demo-before-after.spec.js -g "Delete post"');
    process.exit(1);
  }
  return candidates[0].video;
}

function probeDuration(file) {
  const r = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'csv=p=0',
    file,
  ], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`[hstack] ffprobe failed on ${file}:\n${r.stderr}`);
    process.exit(1);
  }
  const d = parseFloat(r.stdout.trim());
  if (!Number.isFinite(d) || d <= 0) {
    console.error(`[hstack] Could not parse duration of ${file}: "${r.stdout}"`);
    process.exit(1);
  }
  return d;
}

function main() {
  if (!which('ffmpeg') || !which('ffprobe')) {
    console.error('[hstack] ffmpeg/ffprobe not on PATH.');
    console.error('         Install:  winget install Gyan.FFmpeg  (Windows)');
    process.exit(1);
  }

  // Match the unique tail of the test title. Playwright slugifies em-dashes
  // out, so "before — delete post (working)" → "...delete-post-working".
  const before = findVideoByTestTitle('delete-post-working');
  const after = findVideoByTestTitle('delete-post-bug');
  console.log(`[hstack] before video: ${before}`);
  console.log(`[hstack] after  video: ${after}`);

  const dBefore = probeDuration(before);
  const dAfter = probeDuration(after);
  const target = Math.max(dBefore, dAfter);
  console.log(`[hstack] before = ${dBefore.toFixed(2)}s   after = ${dAfter.toFixed(2)}s   target = ${target.toFixed(2)}s`);

  const filter = [
    `[0:v]tpad=stop_mode=clone:stop_duration=${(target - dBefore).toFixed(3)}[v0]`,
    `[1:v]tpad=stop_mode=clone:stop_duration=${(target - dAfter).toFixed(3)}[v1]`,
    `[v0][v1]hstack=inputs=2[out]`,
  ].join(';');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const args = [
    '-y',
    '-i', before,
    '-i', after,
    '-filter_complex', filter,
    '-map', '[out]',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-pix_fmt', 'yuv420p',
    '-an',
    FINAL_OUT,
  ];

  console.log('[hstack] Running ffmpeg…');
  const r = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('[hstack] ffmpeg failed.');
    process.exit(r.status || 1);
  }

  const stat = fs.statSync(FINAL_OUT);
  console.log(`\n[hstack] Done → ${FINAL_OUT}  (${(stat.size / 1024 / 1024).toFixed(2)} MB)\n`);
}

main();
