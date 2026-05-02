# MiniBlog · Demo Video Automation

Playwright-driven, narrated walkthrough of the MiniBlog full-stack app.
The run produces:

1. A raw Playwright `.webm` recording (1280×800, video always retained).
2. A final **narrated MP4** with synced voiceover, written to
   `demo-output/demo-narrated.mp4`.

## 1. Setup

```bash
# from project root
npm install
npx playwright install
```

Make sure **ffmpeg** is on `PATH` (required only for the voiceover build):

| OS      | Install                          |
| ------- | -------------------------------- |
| Windows | `winget install Gyan.FFmpeg`     |
| macOS   | `brew install ffmpeg`            |
| Linux   | `sudo apt install ffmpeg`        |

## 2. Run commands

| Command                       | What it does                                              |
| ----------------------------- | --------------------------------------------------------- |
| `npm start`                   | Start the MiniBlog server on `http://localhost:8080`.     |
| `npm test`                    | Run all Playwright tests.                                 |
| `npm run demo`                | Record the narrated demo (auto-starts the server).        |
| `npm run demo:headed`         | Same, but force a visible browser window.                 |
| `npm run demo:report`         | Open the last Playwright HTML report.                     |
| `npm run voiceover:build`     | Generate TTS audio + mux into final MP4.                  |
| `npm run demo:voiceover`      | One-shot: record + build narrated MP4.                    |

## 3. Where files are saved

| Path                                       | Purpose                                |
| ------------------------------------------ | -------------------------------------- |
| `test-results/**/video.webm`               | Raw Playwright recording.              |
| `demo-output/voiceover-timeline.json`      | Node-side narration timeline.          |
| `demo-output/last-video-path.txt`          | Pointer to the latest `.webm`.         |
| `demo-output/audio/narration-XXX.wav`      | Per-line TTS clips.                    |
| `demo-output/demo-narrated.mp4`            | Final narrated MP4 (H.264 + AAC).      |
| `playwright-report/`                       | HTML test report.                      |

## 4. Voiceover build

The build pipeline is purely Node + ffmpeg, no cloud calls:

1. `tests/demo-video.spec.js` writes each spoken line to
   `demo-output/voiceover-timeline.json` with the elapsed time in seconds.
2. `scripts/build-voiceover.js` synthesizes one `.wav` per line via the OS TTS:
   - **Windows** → `System.Speech` (PowerShell — already installed).
   - **macOS** → `/usr/bin/say` (already installed) + `ffmpeg` for AIFF→WAV.
   - **Linux** → `espeak-ng` (`sudo apt install espeak-ng`).
3. ffmpeg `adelay`s each clip to its timeline offset, `amix`es them, and muxes
   the result over the Playwright video as `demo-output/demo-narrated.mp4`.

## 5. OS TTS requirements

| OS      | Built-in?                           | Extra install           |
| ------- | ----------------------------------- | ----------------------- |
| Windows | Yes (System.Speech via PowerShell). | None.                   |
| macOS   | Yes (`/usr/bin/say`).               | `brew install ffmpeg`.  |
| Linux   | No.                                 | `sudo apt install espeak-ng ffmpeg`. |

## 6. How to replace placeholders

The demo script picks a fresh user every run, so no manual data is needed.
Common knobs:

| Where                              | What to change                                                          |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `tests/demo-video.spec.js`         | `uniqueUser()`, the post `title` / `content`, voiceover lines.          |
| `playwright.config.js`             | `viewport`, `slowMo`, `baseURL`, `webServer.command`.                   |
| `tests/helpers/demoEffects.js`     | Overlay colors / sizes (`#__demo-style`), cursor look, ripple duration. |
| `scripts/build-voiceover.js`       | Final MP4 path (`FINAL_OUT`), ffmpeg encode args, TTS rate.             |

If a UI element is hard to target reliably, add a `data-testid` to the HTML
and switch the locator to `page.getByTestId('…')`. Today's locators all use
roles / labels / text, falling back to stable ids (`#delete-btn`, `#logout-btn`,
`#nav-links`) only where the markup lacks an accessible name.

## 7. CI note

In CI, `headless: false` is unusual. The config keeps it `false` so that the
local recording matches what you see on screen. If you want to run the demo
on a headless CI runner, set `PW_HEADLESS=1` and override `use.headless` in
`playwright.config.js`, or wrap with `xvfb-run` on Linux.
