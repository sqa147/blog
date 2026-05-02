// tests/helpers/demoEffects.js
//
// Reusable Playwright helpers that turn a normal test run into a polished,
// client-facing product walkthrough:
//
//   - On-screen step titles (top center pill)
//   - Element highlighting (DOM sweep — never relies on stale element refs)
//   - Smooth red cursor that follows interactions
//   - Click ripple animation
//   - Human-like typing
//   - Live voiceover preview via window.speechSynthesis (best-effort, never throws)
//   - Voiceover timeline persisted Node-side (NOT in window storage), so it
//     survives every navigation
//
// The Node-side timeline is consumed by scripts/build-voiceover.js to produce
// a final narrated MP4 with ffmpeg.

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', 'demo-output');
const TIMELINE_PATH = path.join(OUTPUT_DIR, 'voiceover-timeline.json');

// Estimated speech rate. The OS TTS in build-voiceover.js runs around
// ~155 wpm, so we pace the test against that to keep live preview and
// the final muxed MP4 in lock-step with the on-screen action.
const WORDS_PER_MINUTE = 155;
const MIN_NARRATION_MS = 1800;
const TAIL_PAD_MS = 450; // small breath after each line so it never feels rushed

let startTime = null;
// Wall-clock timestamp by which the *currently playing* narration is
// expected to have finished. The next narrate() blocks until then so
// utterances never get cut off mid-sentence.
let nextSlotAt = 0;

function estimateNarrationMs(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length || 1;
  const ms = Math.round((words / WORDS_PER_MINUTE) * 60_000);
  return Math.max(MIN_NARRATION_MS, ms) + TAIL_PAD_MS;
}

async function _sleep(ms) {
  if (ms <= 0) return;
  await new Promise((r) => setTimeout(r, ms));
}

// ── Timeline (Node-side persistence) ─────────────────────────────────
function resetTimeline() {
  startTime = Date.now();
  nextSlotAt = 0;
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    TIMELINE_PATH,
    JSON.stringify(
      { startedAt: new Date().toISOString(), entries: [] },
      null,
      2
    )
  );
}

function flushTimeline() {
  // Each narrate() call already writes synchronously, so this is a no-op
  // safety hook intended for `afterEach`. Kept for API symmetry and to
  // signal end-of-run to future consumers.
  if (!fs.existsSync(TIMELINE_PATH)) return;
  const data = JSON.parse(fs.readFileSync(TIMELINE_PATH, 'utf8'));
  data.endedAt = new Date().toISOString();
  fs.writeFileSync(TIMELINE_PATH, JSON.stringify(data, null, 2));
}

function _appendEntry(entry) {
  if (!fs.existsSync(TIMELINE_PATH)) return;
  const data = JSON.parse(fs.readFileSync(TIMELINE_PATH, 'utf8'));
  data.entries.push(entry);
  fs.writeFileSync(TIMELINE_PATH, JSON.stringify(data, null, 2));
}

// ── Overlay setup (re-injected on every navigation via addInitScript) ─
async function setupDemoOverlay(page) {
  await page.addInitScript(() => {
    function injectOverlay() {
      if (document.getElementById('__demo-style')) return;

      const style = document.createElement('style');
      style.id = '__demo-style';
      style.textContent = `
        #__demo-title {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
          background: rgba(15,15,15,0.92); color: #fff;
          padding: 12px 28px; border-radius: 999px;
          font: 600 20px/1.3 -apple-system, BlinkMacSystemFont,
                "Segoe UI", system-ui, sans-serif;
          z-index: 2147483646; pointer-events: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          opacity: 0; transition: opacity 0.25s ease;
          max-width: 80vw; text-align: center;
        }
        #__demo-title.visible { opacity: 1; }
        #__demo-cursor {
          position: fixed; width: 26px; height: 26px; border-radius: 50%;
          background: radial-gradient(circle,
            rgba(255,68,68,0.95) 25%, rgba(255,68,68,0) 75%);
          pointer-events: none; z-index: 2147483645;
          transform: translate(-50%, -50%);
          transition: left 0.55s cubic-bezier(.2,.8,.2,1),
                      top 0.55s cubic-bezier(.2,.8,.2,1);
          left: 50%; top: 50%;
          box-shadow: 0 0 12px rgba(255,68,68,0.85);
        }
        .__demo-highlight {
          outline: 3px solid #ff4444 !important;
          outline-offset: 4px !important;
          box-shadow: 0 0 0 6px rgba(255,68,68,0.25) !important;
          transition: outline-color 0.2s, box-shadow 0.2s !important;
        }
        .__demo-ripple {
          position: fixed; width: 56px; height: 56px; border-radius: 50%;
          border: 3px solid #ff4444; pointer-events: none;
          z-index: 2147483644;
          transform: translate(-50%, -50%) scale(0.2);
          opacity: 1; animation: __demo-ripple 0.7s ease-out forwards;
        }
        @keyframes __demo-ripple {
          to { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);

      const title = document.createElement('div');
      title.id = '__demo-title';
      document.body.appendChild(title);

      const cursor = document.createElement('div');
      cursor.id = '__demo-cursor';
      document.body.appendChild(cursor);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectOverlay, { once: true });
    } else {
      injectOverlay();
    }
  });
}

// ── Step title ───────────────────────────────────────────────────────
async function showDemoTitle(page, text) {
  try {
    await page.evaluate((t) => {
      const el = document.getElementById('__demo-title');
      if (!el) return;
      el.textContent = t;
      el.classList.add('visible');
    }, text);
  } catch (_) { /* page may be navigating */ }
}

async function hideDemoTitle(page) {
  try {
    await page.evaluate(() => {
      const el = document.getElementById('__demo-title');
      if (el) el.classList.remove('visible');
    });
  } catch (_) { /* page may be navigating */ }
}

// ── Highlight (DOM sweep — never relies on stale refs) ───────────────
async function highlightElement(page, locator) {
  await clearHighlight(page);
  try {
    await locator.evaluate((el) => {
      el.classList.add('__demo-highlight');
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    });
  } catch (_) {
    // Element may have been replaced after a re-render; skip silently.
  }
}

async function clearHighlight(page) {
  try {
    await page.evaluate(() => {
      document.querySelectorAll('.__demo-highlight').forEach((el) => {
        el.classList.remove('__demo-highlight');
      });
    });
  } catch (_) { /* page may be navigating */ }
}

// ── Cursor & click animation ─────────────────────────────────────────
async function moveCursorToElement(page, locator) {
  let box = null;
  try { box = await locator.boundingBox(); } catch (_) {}
  if (!box) return;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  try {
    await page.evaluate(({ x, y }) => {
      const c = document.getElementById('__demo-cursor');
      if (c) { c.style.left = x + 'px'; c.style.top = y + 'px'; }
    }, { x, y });
  } catch (_) { /* navigating */ }

  try {
    await page.mouse.move(x, y, { steps: 20 });
  } catch (_) { /* navigating */ }
  await page.waitForTimeout(650);
}

async function showClickAnimation(page, locator) {
  let box = null;
  try { box = await locator.boundingBox(); } catch (_) {}
  if (!box) return;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  try {
    await page.evaluate(({ x, y }) => {
      const r = document.createElement('div');
      r.className = '__demo-ripple';
      r.style.left = x + 'px';
      r.style.top = y + 'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 800);
    }, { x, y });
  } catch (_) { /* navigating */ }
  await page.waitForTimeout(220);
}

// ── Human-like typing ────────────────────────────────────────────────
async function typeLikeHuman(page, locator, text) {
  await locator.click();
  await locator.fill('');
  for (const ch of text) {
    await locator.type(ch, { delay: 50 + Math.random() * 60 });
  }
}

// ── Generic pause ────────────────────────────────────────────────────
async function waitForDemo(page, ms = 600) {
  await page.waitForTimeout(ms);
}

// ── Voiceover ────────────────────────────────────────────────────────
//
// Pacing strategy: each line gets a budgeted duration based on its word
// count (~155 wpm) plus a small tail pad. Subsequent calls block until
// that budget elapses, so the next step never starts mid-sentence and
// the previous utterance is never cancelled.
async function narrate(page, text) {
  if (startTime === null) resetTimeline();

  // Wait out the previous line's budget before speaking again.
  const wait = nextSlotAt - Date.now();
  if (wait > 0) await _sleep(wait);

  const time = (Date.now() - startTime) / 1000;
  _appendEntry({ time, text });

  const dur = estimateNarrationMs(text);
  nextSlotAt = Date.now() + dur;

  // Best-effort live preview via browser speech synthesis. Wrapped in
  // try/catch so it never breaks the test, even mid-navigation.
  // Note: we deliberately do NOT call cancel() — the Node-side pacing
  // already guarantees the previous utterance has finished.
  try {
    await page.evaluate((t) => {
      try {
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(t);
          u.rate = 0.95;
          u.pitch = 1.0;
          u.volume = 1.0;
          window.speechSynthesis.speak(u);
        }
      } catch (_) { /* ignore */ }
    }, text);
  } catch (_) { /* page closed / nav in flight */ }
}

// Block the test until the currently-playing narration's budget has
// elapsed. Useful at end-of-step so navigation never clips the audio.
async function awaitNarrationEnd() {
  const wait = nextSlotAt - Date.now();
  if (wait > 0) await _sleep(wait);
}

// ── Composed actions: demoClick / demoFill ───────────────────────────
//
// Each composed action ends by blocking until the current narration's
// budget has elapsed. That keeps the "one functionality demo ending"
// transition unhurried — the next step never barges in mid-sentence.
async function demoClick(page, locator, opts = {}) {
  const { title, voiceover, pause = 700, clickOptions } = opts;
  if (title) await showDemoTitle(page, title);
  if (voiceover) await narrate(page, voiceover);
  await highlightElement(page, locator);
  await moveCursorToElement(page, locator);
  await showClickAnimation(page, locator);
  try {
    await locator.click(clickOptions);
  } finally {
    await waitForDemo(page, pause);
    await awaitNarrationEnd();
    await clearHighlight(page);
  }
}

async function demoFill(page, locator, value, opts = {}) {
  const { title, voiceover, pause = 500 } = opts;
  if (title) await showDemoTitle(page, title);
  if (voiceover) await narrate(page, voiceover);
  await highlightElement(page, locator);
  await moveCursorToElement(page, locator);
  await typeLikeHuman(page, locator, value);
  await waitForDemo(page, pause);
  await awaitNarrationEnd();
  await clearHighlight(page);
}

module.exports = {
  setupDemoOverlay,
  showDemoTitle,
  hideDemoTitle,
  highlightElement,
  clearHighlight,
  moveCursorToElement,
  showClickAnimation,
  typeLikeHuman,
  waitForDemo,
  narrate,
  awaitNarrationEnd,
  resetTimeline,
  flushTimeline,
  demoClick,
  demoFill,
  TIMELINE_PATH,
  OUTPUT_DIR,
};
