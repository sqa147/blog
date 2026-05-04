// tests/demo-before-after.spec.js
//
// Records two short, silent takes of the same login flow:
//   • "before" — checkbox hidden via injected CSS, mimics the pre-PR login
//   • "after"  — new login page with the Remember me checkbox, ticked on submit
//
// Each take carries a persistent BEFORE/AFTER banner across the top of every
// page so the heading is visible throughout the recording. The follow-up
// ffmpeg step (scripts/build-side-by-side.js) hstacks the two .webm files
// from test-results/ into a single MP4. No narration.

const { test, expect, request } = require('@playwright/test');

const {
  setupDemoOverlay,
  showDemoTitle,
  hideDemoTitle,
  demoClick,
  demoFill,
  highlightElement,
  clearHighlight,
  waitForDemo,
} = require('./helpers/demoEffects');

function uniqueUser(prefix) {
  const tag = Date.now().toString(36) + Math.floor(Math.random() * 1000);
  return {
    username: `${prefix}_${tag}`,
    email: `${prefix}_${tag}@example.com`,
    password: 'Passw0rd!',
  };
}

async function preCreateUser(baseURL, user) {
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.post('/api/auth/signup', {
    data: { username: user.username, email: user.email, password: user.password },
  });
  expect(res.ok()).toBeTruthy();
  await ctx.dispose();
}

// Persistent BEFORE/AFTER banner stamped on every page via addInitScript so
// it survives navigations. Pushes existing nav and step-title pill down 56px.
async function installHeadingBanner(page, text, accent) {
  await page.addInitScript(({ text, accent }) => {
    const inject = () => {
      if (document.getElementById('__demo-heading')) return;
      const style = document.createElement('style');
      style.id = '__demo-heading-style';
      style.textContent = `
        #__demo-heading {
          position: fixed; top: 0; left: 0; right: 0;
          height: 56px; line-height: 56px;
          background: ${accent}; color: #fff;
          font: 800 26px/56px -apple-system, BlinkMacSystemFont,
                "Segoe UI", system-ui, sans-serif;
          letter-spacing: 0.16em;
          text-align: center;
          z-index: 2147483647;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          pointer-events: none;
        }
        body { padding-top: 56px !important; }
        #__demo-title { top: 80px !important; }
      `;
      document.head.appendChild(style);
      const banner = document.createElement('div');
      banner.id = '__demo-heading';
      banner.textContent = text;
      document.body.appendChild(banner);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject, { once: true });
    } else {
      inject();
    }
  }, { text, accent });
}

test.describe('MiniBlog · Remember me · before / after', () => {
  test('before — old login (no Remember me)', async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await setupDemoOverlay(page);
    await installHeadingBanner(page, 'BEFORE — Old login (no Remember me)', '#6b7280');

    // Hide the new checkbox so the page looks like the pre-change UI.
    await page.addInitScript(() => {
      const css = `#remember-me, label.checkbox-row { display: none !important; }`;
      const apply = () => {
        if (document.getElementById('__demo-hide-rm')) return;
        const s = document.createElement('style');
        s.id = '__demo-hide-rm';
        s.textContent = css;
        document.head.appendChild(s);
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply, { once: true });
      } else {
        apply();
      }
    });

    const user = uniqueUser('before');
    await preCreateUser(baseURL, user);

    await page.goto('/login.html');
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    await showDemoTitle(page, 'Old login page');
    await waitForDemo(page, 1500);

    await demoFill(page, page.getByLabel('Email'), user.email, { title: 'Enter email' });
    await demoFill(page, page.getByLabel('Password'), user.password, { title: 'Enter password' });

    // Filler step matching the "after" timeline (where we tick the box).
    await showDemoTitle(page, 'No Remember me option');
    await waitForDemo(page, 1800);

    await demoClick(page, page.getByRole('button', { name: 'Log in', exact: true }), { title: 'Log in' });
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '');
    await expect(page.getByRole('heading', { name: 'Latest posts' })).toBeVisible();

    await showDemoTitle(page, 'Logged in (session only)');
    await waitForDemo(page, 1500);

    await demoClick(page, page.locator('#logout-btn'), { title: 'Log out' });
    await expect(
      page.locator('#nav-links').getByRole('link', { name: 'Login', exact: true })
    ).toBeVisible();
    await waitForDemo(page, 600);

    await hideDemoTitle(page);
  });

  test('after — new login with Remember me', async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await setupDemoOverlay(page);
    await installHeadingBanner(page, 'AFTER — New login with Remember me', '#2563eb');

    const user = uniqueUser('after');
    await preCreateUser(baseURL, user);

    await page.goto('/login.html');
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
    await showDemoTitle(page, 'New login page');
    await waitForDemo(page, 1500);

    await demoFill(page, page.getByLabel('Email'), user.email, { title: 'Enter email' });
    await demoFill(page, page.getByLabel('Password'), user.password, { title: 'Enter password' });

    const checkbox = page.locator('#remember-me');
    await highlightElement(page, checkbox);
    await showDemoTitle(page, 'New: Remember me checkbox');
    await waitForDemo(page, 1200);
    await clearHighlight(page);

    await demoClick(page, checkbox, { title: 'Tick Remember me' });
    await expect(checkbox).toBeChecked();

    await demoClick(page, page.getByRole('button', { name: 'Log in', exact: true }), { title: 'Log in' });
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '');
    await expect(page.getByRole('heading', { name: 'Latest posts' })).toBeVisible();

    await showDemoTitle(page, 'Logged in (remembered for 30 days)');
    await waitForDemo(page, 1500);

    await demoClick(page, page.locator('#logout-btn'), { title: 'Log out' });
    await expect(
      page.locator('#nav-links').getByRole('link', { name: 'Login', exact: true })
    ).toBeVisible();
    await waitForDemo(page, 600);

    await hideDemoTitle(page);
  });
});
