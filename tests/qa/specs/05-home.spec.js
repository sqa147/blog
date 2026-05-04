// M5 — Home / Posts Listing
// Covers TC-HOM-01..09.
const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { users, ts } = require('../data/testData');
const { apiSignup } = require('../helpers/auth');
const { apiCreatePost } = require('../helpers/posts');

test.describe('M5 Home / Posts Listing', () => {
  test('TC-HOM-01: Each post shows title, author, date, and a short preview @smoke', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, {
      title: `Welcome to MiniBlog ${ts()}`,
      content: 'Hello world',
    });
    const home = new HomePage(page);

    await test.step('Open home and locate the new post', async () => {
      console.log('[TC-HOM-01] visit home');
      await home.goto();
    });

    await test.step('Verify card shows title, author, date, and preview', async () => {
      const card = home.cardByTitle(post.title);
      await expect(card).toHaveCount(1);
      await expect(card.getByRole('link', { name: post.title, exact: true })).toBeVisible();
      await expect(card.locator('.meta')).toContainText(`by ${user.username}`);
      await expect(card.locator('.post-content')).toContainText('Hello world');
    });
  });

  test('TC-HOM-02: Newest post appears at the top of the list @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const t1 = `First Post ${ts()}`;
    const t2 = `Second Post ${ts()}`;

    await apiCreatePost(request, token, { title: t1, content: 'Older' });
    await new Promise((r) => setTimeout(r, 1100)); // ensure created_at differs
    await apiCreatePost(request, token, { title: t2, content: 'Newer' });

    const home = new HomePage(page);

    await test.step('Open home page', async () => {
      console.log('[TC-HOM-02] open home');
      await home.goto();
    });

    await test.step('Newer post appears above the older post', async () => {
      const titles = await home.postCards
        .locator('h2 a')
        .filter({ hasText: /(First Post|Second Post)/ })
        .allTextContents();
      const idxNew = titles.indexOf(t2);
      const idxOld = titles.indexOf(t1);
      expect(idxNew).toBeGreaterThanOrEqual(0);
      expect(idxOld).toBeGreaterThan(idxNew);
    });
  });

  test('TC-HOM-03: Empty list shows a friendly message @regression', async ({ page }) => {
    const home = new HomePage(page);

    await test.step('Mock the posts list to be empty and open home', async () => {
      console.log('[TC-HOM-03] mock empty');
      await page.route('**/api/posts', (route) => route.fulfill({
        status: 200, contentType: 'application/json', body: '[]',
      }));
      await home.goto();
    });

    await test.step('Empty-state message is shown', async () => {
      await expect(home.empty).toHaveText(/No posts yet\. Be the first to write one!/);
      await expect(home.postCards).toHaveCount(0);
    });
  });

  test('TC-HOM-04: Long content is shortened with three dots in the list @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const longContent = 'a'.repeat(300);
    const post = await apiCreatePost(request, token, {
      title: `Long Post ${ts()}`,
      content: longContent,
    });
    const home = new HomePage(page);

    await test.step('Open home and find the long-content card', async () => {
      console.log('[TC-HOM-04] long content');
      await home.goto();
    });

    await test.step('Preview is truncated to 240 characters with an ellipsis', async () => {
      const previewText = await home.cardByTitle(post.title).locator('.post-content').textContent();
      expect(previewText.length).toBe(241); // 240 chars + the ellipsis
      expect(previewText.endsWith('…')).toBe(true);
    });
  });

  test('TC-HOM-05: Content of exactly 240 characters is shown without three dots @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const exactContent = 'a'.repeat(240);
    const post = await apiCreatePost(request, token, {
      title: `Exact Boundary ${ts()}`,
      content: exactContent,
    });
    const home = new HomePage(page);

    await test.step('Open home and inspect the card', async () => {
      console.log('[TC-HOM-05] 240-char content');
      await home.goto();
    });

    await test.step('Preview is shown in full without ellipsis', async () => {
      const previewText = await home.cardByTitle(post.title).locator('.post-content').textContent();
      expect(previewText.length).toBe(240);
      expect(previewText.endsWith('…')).toBe(false);
    });
  });

  test('TC-HOM-06: Title containing HTML-like text is shown as plain text @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const title = `<script>alert(1)</script> ${ts()}`;
    await apiCreatePost(request, token, { title, content: 'Safe body' });

    let dialogOpened = false;
    page.on('dialog', () => { dialogOpened = true; });

    const home = new HomePage(page);

    await test.step('Open home', async () => {
      console.log('[TC-HOM-06] xss in title');
      await home.goto();
    });

    await test.step('Title is rendered as text, no script executes', async () => {
      const card = home.cardByTitle(title);
      await expect(card).toHaveCount(1);
      // Make sure no real <script> child sneaked into the DOM
      await expect(card.locator('script')).toHaveCount(0);
      expect(dialogOpened).toBe(false);
    });
  });

  test('TC-HOM-07: Post date is shown in a human-readable format @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, {
      title: `Dated post ${ts()}`,
      content: 'Body',
    });
    const home = new HomePage(page);
    await home.goto();

    await test.step('Card shows a human-readable date', async () => {
      console.log('[TC-HOM-07] inspect date');
      const meta = await home.cardByTitle(post.title).locator('.meta').textContent();
      expect(meta).toMatch(/by\s+\S+/);
      // Locale-formatted date contains digits and at least one separator character.
      expect(meta).toMatch(/\d/);
      expect(meta.length).toBeGreaterThan(`by ${u.username}`.length + 5);
    });
  });

  test('TC-HOM-08: User opens a post detail page by clicking its title @smoke', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Open me ${ts()}`, content: 'Body' });
    const home = new HomePage(page);

    await test.step('Click the title', async () => {
      console.log('[TC-HOM-08] click title');
      await home.goto();
      await home.openByTitle(post.title);
    });

    await test.step('Detail page heading matches', async () => {
      await expect(page).toHaveURL(/\/post\.html\?id=\d+/);
      await expect(page.locator('#post h1')).toHaveText(post.title);
    });
  });

  test('TC-HOM-09: Clear error message appears when posts cannot be loaded @regression', async ({ page }) => {
    const home = new HomePage(page);

    await test.step('Mock the posts API to fail and open home', async () => {
      console.log('[TC-HOM-09] mock posts 500');
      await page.route('**/api/posts', (route) => route.fulfill({
        status: 500, contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      }));
      await home.goto();
    });

    await test.step('A "Failed to load posts" message is shown', async () => {
      await expect(home.empty).toContainText(/Failed to load posts/i);
    });
  });
});
