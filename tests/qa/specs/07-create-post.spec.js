// M7 — New Post
// Covers TC-CRT-01..11.
const { test, expect } = require('@playwright/test');
const { CreatePostPage } = require('../pages/CreatePostPage');
const { PostDetailPage } = require('../pages/PostDetailPage');
const { LoginPage } = require('../pages/LoginPage');
const { users, ts } = require('../data/testData');
const {
  ensureSignedIn,
  apiSignup,
  setSession,
  clearSession,
  setTamperedSession,
} = require('../helpers/auth');

test.describe('M7 New Post', () => {
  test('TC-CRT-01: Author publishes a new post with valid details @smoke', async ({ page, request }) => {
    const u = users.primary();
    await ensureSignedIn(page, request, u);
    const create = new CreatePostPage(page);
    const detail = new PostDetailPage(page);
    const post = { title: `QA Roadmap ${ts()}`, content: 'Plans for automation, cross-browser, and security review.' };

    await test.step('Publish a valid post via the New Post form', async () => {
      console.log('[TC-CRT-01] publish');
      await create.goto();
      await create.publishPost(post);
      await page.waitForURL(/\/post\.html\?id=\d+/);
    });

    await test.step('Detail page shows the post and Delete button', async () => {
      await expect(detail.title).toHaveText(post.title);
      await expect(detail.content).toContainText(post.content);
      await expect(detail.meta).toContainText(`by ${u.username}`);
      await expect(detail.deleteBtn).toBeVisible();
    });
  });

  test('TC-CRT-02: Title cannot be left empty @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());
    const create = new CreatePostPage(page);

    await test.step('Submit with empty title', async () => {
      console.log('[TC-CRT-02] empty title');
      await create.goto();
      await create.publishPost({ title: '', content: 'Some content' });
    });

    await test.step('Form did not submit, title is invalid', async () => {
      expect(new URL(page.url()).pathname).toBe('/create.html');
      const valueMissing = await create.title.evaluate((el) => el.validity.valueMissing);
      expect(valueMissing).toBe(true);
    });
  });

  test('TC-CRT-03: Content cannot be left empty @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());
    const create = new CreatePostPage(page);

    await test.step('Submit with empty content', async () => {
      console.log('[TC-CRT-03] empty content');
      await create.goto();
      await create.publishPost({ title: 'Hello', content: '' });
    });

    await test.step('Form did not submit, content is invalid', async () => {
      expect(new URL(page.url()).pathname).toBe('/create.html');
      const valueMissing = await create.content.evaluate((el) => el.validity.valueMissing);
      expect(valueMissing).toBe(true);
    });
  });

  test('TC-CRT-04: Validation message shown when title or content is missing @regression', async ({ request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    console.log('[TC-CRT-04] empty body to posts');

    const res = await request.post('/api/posts', {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: '', content: '' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('title and content are required');
  });

  test('TC-CRT-05: Title containing only spaces is treated as empty @regression', async ({ page, request }) => {
    // The server only checks `!title`; the client trims before sending, so the
    // user-visible behavior comes from submitting through the UI.
    await ensureSignedIn(page, request, users.primary());
    const create = new CreatePostPage(page);

    await test.step('Submit whitespace-only title via the form', async () => {
      console.log('[TC-CRT-05] whitespace-only title via UI');
      await create.goto();
      await create.title.fill('     ');
      await create.content.fill('valid');
      await create.publish.click();
    });

    await test.step('Validation message is displayed and no post is created', async () => {
      await expect(create.error).toContainText(/title and content are required/i);
      expect(new URL(page.url()).pathname).toBe('/create.html');
    });
  });

  test('TC-CRT-06: Title with exactly 200 characters is accepted @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());
    const create = new CreatePostPage(page);
    const detail = new PostDetailPage(page);
    const longTitle = 'a'.repeat(200);

    await test.step('Publish with a 200-char title', async () => {
      console.log('[TC-CRT-06] 200-char title');
      await create.goto();
      await create.publishPost({ title: longTitle, content: 'Boundary test' });
      await page.waitForURL(/\/post\.html\?id=\d+/);
    });

    await test.step('Detail page shows the full 200 characters', async () => {
      await expect(detail.title).toHaveText(longTitle);
      expect((await detail.title.textContent()).length).toBe(200);
    });
  });

  test('TC-CRT-07: Title field stops accepting input after 200 characters @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());
    const create = new CreatePostPage(page);
    await create.goto();

    await test.step('Type 250 characters', async () => {
      console.log('[TC-CRT-07] type 250 chars');
      await create.title.click();
      await create.title.pressSequentially('a'.repeat(250), { delay: 0 });
    });

    await test.step('Only 200 characters are accepted', async () => {
      const value = await create.title.inputValue();
      expect(value.length).toBe(200);
      expect(await create.title.getAttribute('maxlength')).toBe('200');
    });
  });

  test('TC-CRT-08: Visitor is redirected to Login when opening the New Post page @smoke', async ({ page }) => {
    const login = new LoginPage(page);

    await test.step('Open New Post as a visitor', async () => {
      console.log('[TC-CRT-08] visitor opens create');
      await page.goto('/create.html');
      await page.waitForURL(/\/login\.html$/);
    });

    await test.step('Login page is shown', async () => {
      await expect(login.heading).toBeVisible();
    });
  });

  test('TC-CRT-09: User without a valid session is sent to Login when opening New Post @regression', async ({ page }) => {
    const login = new LoginPage(page);

    await test.step('Clear session and open New Post', async () => {
      console.log('[TC-CRT-09] cleared session');
      await clearSession(page);
      await page.goto('/create.html');
      await page.waitForURL(/\/login\.html$/);
    });

    await test.step('Login page is shown', async () => {
      await expect(login.heading).toBeVisible();
    });
  });

  test('TC-CRT-10: Expired session shows an error and returns the user to Login @regression', async ({ page }) => {
    await setTamperedSession(page, 'ali.khan');
    const create = new CreatePostPage(page);
    const login = new LoginPage(page);

    await test.step('Submit a post with an invalid session', async () => {
      console.log('[TC-CRT-10] expired session publish');
      await create.goto();
      await expect(create.heading).toBeVisible();
      await create.publishPost({ title: 'Test', content: 'Should fail' });
    });

    await test.step('Error mentions the session, then page redirects to Login', async () => {
      await expect(create.error).toContainText(/token/i);
      await page.waitForURL(/\/login\.html$/, { timeout: 5_000 });
      await expect(login.heading).toBeVisible();
    });
  });

  test('TC-CRT-11: Title and content are saved without leading or trailing spaces @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());
    const create = new CreatePostPage(page);
    const detail = new PostDetailPage(page);
    const padded = { title: '  Padded Title  ', content: '  body  ' };

    await test.step('Publish padded title and content', async () => {
      console.log('[TC-CRT-11] padded post');
      await create.goto();
      await create.publishPost(padded);
      await page.waitForURL(/\/post\.html\?id=\d+/);
    });

    await test.step('Detail page shows trimmed title and content', async () => {
      await expect(detail.title).toHaveText('Padded Title');
      await expect(detail.content).toHaveText('body');
    });
  });
});
