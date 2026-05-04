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

test.describe('MiniBlog · Delete post · before / after', () => {
  // BEFORE: working delete — the home page no longer lists the post.
  // (Server is buggy in this PR, so we mock the home list to mimic the
  // pre-PR behaviour for the recording. Same trick the comments demo uses
  // with #comments-section.)
  test('before — delete post (working)', async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await setupDemoOverlay(page);
    await installHeadingBanner(page, 'BEFORE — Delete post removes it', '#16a34a');

    const user = uniqueUser('before_d');
    await preCreateUser(baseURL, user);

    const ctx = await request.newContext({ baseURL });
    const loginRes = await ctx.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { token, user: u } = await loginRes.json();
    const postRes = await ctx.post('/api/posts', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Delete me — working build', content: 'Should be gone after delete.' },
    });
    const post = await postRes.json();
    await ctx.dispose();

    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem('token', t);
      window.localStorage.setItem('user', JSON.stringify(u));
    }, { t: token, u });

    // Mimic pre-PR backend: after the delete API call, the home list no
    // longer contains this post. We filter the live list to drop it.
    let deleted = false;
    await page.route('**/api/posts/' + post.id, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleted = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      } else {
        await route.continue();
      }
    });
    await page.route('**/api/posts', async (route) => {
      if (route.request().method() !== 'GET') return route.continue();
      const resp = await route.fetch();
      const body = await resp.json();
      const filtered = deleted ? body.filter((p) => p.id !== post.id) : body;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    });

    await page.goto(`/post.html?id=${post.id}`);
    await expect(page.locator('#post h1')).toHaveText('Delete me — working build');
    await showDemoTitle(page, 'Open the post you want to delete');
    await waitForDemo(page, 1500);

    const deleteBtn = page.getByRole('button', { name: 'Delete', exact: true });
    await highlightElement(page, deleteBtn);
    await showDemoTitle(page, 'Click Delete');
    await waitForDemo(page, 1200);
    await clearHighlight(page);

    // Auto-accept the confirm dialog.
    page.once('dialog', (d) => d.accept());
    await demoClick(page, deleteBtn, { title: 'Confirm "Delete this post?"' });
    await page.waitForURL((url) => url.pathname === '/');

    await expect(page.getByRole('heading', { name: 'Latest posts' })).toBeVisible();
    const card = page.locator('article.card', { hasText: 'Delete me — working build' });
    await expect(card).toHaveCount(0);
    await showDemoTitle(page, 'Post is gone from the list ✔');
    await waitForDemo(page, 2200);

    await hideDemoTitle(page);
  });

  // AFTER: buggy delete — server returns 200 OK but the row is never removed.
  // The home page still shows the post.
  test('after — delete post (bug)', async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await setupDemoOverlay(page);
    await installHeadingBanner(page, 'AFTER — Delete reports OK but post stays', '#dc2626');

    const user = uniqueUser('after_d');
    await preCreateUser(baseURL, user);

    const ctx = await request.newContext({ baseURL });
    const loginRes = await ctx.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { token, user: u } = await loginRes.json();
    const postRes = await ctx.post('/api/posts', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Delete me — buggy build', content: 'Will look deleted but is not.' },
    });
    const post = await postRes.json();
    await ctx.dispose();

    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem('token', t);
      window.localStorage.setItem('user', JSON.stringify(u));
    }, { t: token, u });

    await page.goto(`/post.html?id=${post.id}`);
    await expect(page.locator('#post h1')).toHaveText('Delete me — buggy build');
    await showDemoTitle(page, 'Open the post you want to delete');
    await waitForDemo(page, 1500);

    const deleteBtn = page.getByRole('button', { name: 'Delete', exact: true });
    await highlightElement(page, deleteBtn);
    await showDemoTitle(page, 'Click Delete');
    await waitForDemo(page, 1200);
    await clearHighlight(page);

    page.once('dialog', (d) => d.accept());
    await demoClick(page, deleteBtn, { title: 'Confirm "Delete this post?"' });
    await page.waitForURL((url) => url.pathname === '/');

    await expect(page.getByRole('heading', { name: 'Latest posts' })).toBeVisible();
    const card = page.locator('article.card', { hasText: 'Delete me — buggy build' });
    await expect(card.first()).toBeVisible();
    await highlightElement(page, card.first());
    await showDemoTitle(page, 'Bug: post is still in the list ✘');
    await waitForDemo(page, 2400);
    await clearHighlight(page);

    await hideDemoTitle(page);
  });
});

test.describe('MiniBlog · Comments · before / after', () => {
  test('before — old post detail (no comments)', async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await setupDemoOverlay(page);
    await installHeadingBanner(page, 'BEFORE — Post detail with no comments', '#6b7280');

    // Mimic pre-PR UI: hide the new comments section so the page looks the way
    // it did before this change.
    await page.addInitScript(() => {
      const css = `#comments-section { display: none !important; }`;
      const apply = () => {
        if (document.getElementById('__demo-hide-comments')) return;
        const s = document.createElement('style');
        s.id = '__demo-hide-comments';
        s.textContent = css;
        document.head.appendChild(s);
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', apply, { once: true });
      } else {
        apply();
      }
    });

    const user = uniqueUser('before_c');
    await preCreateUser(baseURL, user);

    // Sign in via API + create a post for a stable demo target.
    const ctx = await request.newContext({ baseURL });
    const loginRes = await ctx.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { token, user: u } = await loginRes.json();
    const postRes = await ctx.post('/api/posts', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Welcome to MiniBlog', content: 'A short demo post.' },
    });
    const post = await postRes.json();
    await ctx.dispose();

    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem('token', t);
      window.localStorage.setItem('user', JSON.stringify(u));
    }, { t: token, u });

    await page.goto(`/post.html?id=${post.id}`);
    await expect(page.locator('#post h1')).toHaveText('Welcome to MiniBlog');
    await showDemoTitle(page, 'Open a post — no way to comment');
    await waitForDemo(page, 2200);

    await showDemoTitle(page, 'Page ends at the article — no comments area');
    await waitForDemo(page, 2200);

    await hideDemoTitle(page);
  });

  test('after — new post detail (with comments)', async ({ page, baseURL }) => {
    test.setTimeout(180_000);
    await setupDemoOverlay(page);
    await installHeadingBanner(page, 'AFTER — Post detail with comments', '#2563eb');

    const user = uniqueUser('after_c');
    await preCreateUser(baseURL, user);

    const ctx = await request.newContext({ baseURL });
    const loginRes = await ctx.post('/api/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { token, user: u } = await loginRes.json();
    const postRes = await ctx.post('/api/posts', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: 'Welcome to MiniBlog', content: 'A short demo post.' },
    });
    const post = await postRes.json();
    await ctx.dispose();

    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem('token', t);
      window.localStorage.setItem('user', JSON.stringify(u));
    }, { t: token, u });

    await page.goto(`/post.html?id=${post.id}`);
    await expect(page.locator('#post h1')).toHaveText('Welcome to MiniBlog');
    await showDemoTitle(page, 'Open a post — comments section visible');
    await waitForDemo(page, 1600);

    const section = page.locator('#comments-section');
    await highlightElement(page, section);
    await showDemoTitle(page, 'New: Comments section under every post');
    await waitForDemo(page, 1500);
    await clearHighlight(page);

    const textarea = page.locator('#comment-content');
    await demoFill(page, textarea, 'Great post! Thanks for sharing.', { title: 'Write a comment' });

    const submit = page.locator('#comment-form button[type="submit"]');
    await demoClick(page, submit, { title: 'Post comment' });

    await expect(page.locator('#comments-heading')).toHaveText('Comments (1)');
    await showDemoTitle(page, 'Comment posted — counter updates to (1)');
    await waitForDemo(page, 2000);

    const card = page.locator('#comments-list .comment-card').first();
    await highlightElement(page, card.locator('.comment-delete'));
    await showDemoTitle(page, 'Author can delete their own comment');
    await waitForDemo(page, 1500);
    await clearHighlight(page);

    await hideDemoTitle(page);
  });
});

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
