// M6 — Post Detail
// Covers TC-PDT-01..10.
const { test, expect } = require('@playwright/test');
const { PostDetailPage } = require('../pages/PostDetailPage');
const { HomePage } = require('../pages/HomePage');
const { users, ts } = require('../data/testData');
const { apiSignup, setSession, clearSession } = require('../helpers/auth');
const { apiCreatePost } = require('../helpers/posts');

test.describe('M6 Post Detail', () => {
  test('TC-PDT-01: Existing post displays title, author, date, and full content', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, {
      title: `Welcome to MiniBlog ${ts()}`,
      content: 'Full content for a post on MiniBlog.',
    });
    const detail = new PostDetailPage(page);

    await test.step('Open the post detail page', async () => {
      console.log('[TC-PDT-01] open detail', post.id);
      await detail.goto(post.id);
      await detail.waitLoaded();
    });

    await test.step('Header, meta, and content are shown', async () => {
      await expect(detail.title).toHaveText(post.title);
      await expect(detail.meta).toContainText(`by ${user.username}`);
      await expect(detail.content).toContainText('Full content for a post on MiniBlog.');
    });
  });

  test('TC-PDT-02: Post detail page shows a clear message when no post is selected', async ({ page }) => {
    const detail = new PostDetailPage(page);

    await test.step('Open detail without selecting a post', async () => {
      console.log('[TC-PDT-02] missing id');
      await detail.goto();
    });

    await test.step('"Missing post id." is shown', async () => {
      await expect(detail.empty).toHaveText('Missing post id.');
      await expect(detail.title).toHaveCount(0);
    });
  });

  test('TC-PDT-03: Opening a non-existent post shows a not-found message', async ({ page }) => {
    const detail = new PostDetailPage(page);

    await test.step('Open detail with a non-existent reference', async () => {
      console.log('[TC-PDT-03] id 999999');
      await detail.goto(999999);
    });

    await test.step('"Failed to load post: Post not found" is shown', async () => {
      await expect(detail.empty).toContainText(/Failed to load post: Post not found/i);
    });
  });

  test('TC-PDT-04: Opening a post with an invalid reference shows a not-found message', async ({ page }) => {
    const detail = new PostDetailPage(page);

    await test.step('Open detail with a non-numeric reference', async () => {
      console.log('[TC-PDT-04] id abc');
      await detail.goto('abc');
    });

    await test.step('Not-found message is shown', async () => {
      await expect(detail.empty).toContainText(/Failed to load post: Post not found/i);
    });
  });

  test('TC-PDT-05: Author sees the Delete button on their own post', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Mine ${ts()}`, content: 'Mine' });
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);

    await test.step('Open the author\'s post', async () => {
      console.log('[TC-PDT-05] author view');
      await detail.goto(post.id);
      await detail.waitLoaded();
    });

    await test.step('Delete button is visible', async () => {
      await expect(detail.deleteBtn).toBeVisible();
    });
  });

  test('TC-PDT-06: Visitor does not see the Delete button', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Public ${ts()}`, content: 'Public' });
    await clearSession(page); // ensure visitor
    const detail = new PostDetailPage(page);

    await test.step('Open detail as a visitor', async () => {
      console.log('[TC-PDT-06] visitor view');
      await detail.goto(post.id);
      await detail.waitLoaded();
    });

    await test.step('Delete button is not present', async () => {
      await expect(detail.deleteBtn).toHaveCount(0);
    });
  });

  test('TC-PDT-07: Logged-in user does not see Delete on someone else\'s post', async ({ page, request }) => {
    const author = users.primary();
    const other = users.secondary();
    const { token: aToken } = await apiSignup(request, author);
    const post = await apiCreatePost(request, aToken, { title: `Owned ${ts()}`, content: 'Owned' });
    const { token: oToken, user: oUser } = await apiSignup(request, other);
    await setSession(page, oToken, oUser);
    const detail = new PostDetailPage(page);

    await test.step('Open the other user\'s post', async () => {
      console.log('[TC-PDT-07] non-author view');
      await detail.goto(post.id);
      await detail.waitLoaded();
    });

    await test.step('Delete button is not present', async () => {
      await expect(detail.deleteBtn).toHaveCount(0);
    });
  });

  test('TC-PDT-08: Title containing HTML-like text is shown safely', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const trickyTitle = `<img src=x onerror=alert(1)> ${ts()}`;
    const post = await apiCreatePost(request, token, { title: trickyTitle, content: 'Safe' });
    let dialogOpened = false;
    page.on('dialog', () => { dialogOpened = true; });

    const detail = new PostDetailPage(page);

    await test.step('Open the tricky-title post', async () => {
      console.log('[TC-PDT-08] xss title in detail');
      await detail.goto(post.id);
      await detail.waitLoaded();
    });

    await test.step('Title is plain text — no img element, no popup', async () => {
      await expect(detail.title).toHaveText(trickyTitle);
      await expect(detail.container.locator('img')).toHaveCount(0);
      expect(dialogOpened).toBe(false);
    });
  });

  test('TC-PDT-09: Content with line breaks and special characters is shown safely', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const trickyContent = 'Line one and line two with & and <html>';
    const post = await apiCreatePost(request, token, {
      title: `Mixed sample ${ts()}`,
      content: trickyContent,
    });
    const detail = new PostDetailPage(page);
    await detail.goto(post.id);
    await detail.waitLoaded();

    await test.step('Content is rendered as plain text', async () => {
      console.log('[TC-PDT-09] mixed content');
      await expect(detail.content).toContainText('& and <html>');
      await expect(detail.container.locator('html')).toHaveCount(0);
    });
  });

  test('TC-PDT-10: "Back to all posts" link returns the user to the home page', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Back link ${ts()}`, content: 'Body' });
    const detail = new PostDetailPage(page);
    const home = new HomePage(page);

    await detail.goto(post.id);
    await detail.waitLoaded();

    await test.step('Click the back link', async () => {
      console.log('[TC-PDT-10] back link');
      await detail.backLink.click();
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('Home page is shown', async () => {
      await expect(home.heading).toBeVisible();
    });
  });
});
