// M4 — Logout
// Covers TC-LGT-01..04.
const { test, expect } = require('@playwright/test');
const { NavBar } = require('../pages/NavBar');
const { HomePage } = require('../pages/HomePage');
const { CreatePostPage } = require('../pages/CreatePostPage');
const { PostDetailPage } = require('../pages/PostDetailPage');
const { LoginPage } = require('../pages/LoginPage');
const { users, ts } = require('../data/testData');
const { apiSignup, setSession, ensureSignedIn } = require('../helpers/auth');
const { apiCreatePost } = require('../helpers/posts');

test.describe('M4 Logout', () => {
  test('TC-LGT-01: User logs out from the home page @smoke', async ({ page, request }) => {
    const u = users.primary();
    await ensureSignedIn(page, request, u);
    const home = new HomePage(page);
    const nav = new NavBar(page);

    await test.step('Open home page while logged in', async () => {
      console.log('[TC-LGT-01] open home logged in');
      await home.goto();
      await nav.expectLoggedIn(u.username);
    });

    await test.step('Click Logout and verify visitor state', async () => {
      await nav.logout();
      await nav.expectVisitor();
      await expect(nav.logoutBtn).toBeHidden();
      await expect(nav.greeting).toHaveCount(0);
    });
  });

  test('TC-LGT-02: User logs out from the New Post page @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());
    const create = new CreatePostPage(page);
    const nav = new NavBar(page);

    await test.step('Open New Post page', async () => {
      console.log('[TC-LGT-02] open New Post');
      await create.goto();
      await expect(create.heading).toBeVisible();
    });

    await test.step('Click Logout and land on home as visitor', async () => {
      await nav.logout();
      await nav.expectVisitor();
    });
  });

  test('TC-LGT-03: User logs out from a post detail page @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Post ${ts()}`, content: 'Body' });
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);
    const nav = new NavBar(page);

    await test.step('Open the post detail page', async () => {
      console.log('[TC-LGT-03] open post', post.id);
      await detail.goto(post.id);
      await detail.waitLoaded();
    });

    await test.step('Click Logout and land on home as visitor', async () => {
      await nav.logout();
      await nav.expectVisitor();
    });
  });

  test('TC-LGT-04: Visitor is sent to the Login page when trying to write a post after logout @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());
    const nav = new NavBar(page);
    const login = new LoginPage(page);

    await test.step('Logout from home', async () => {
      console.log('[TC-LGT-04] logout');
      await page.goto('/');
      await nav.logout();
    });

    await test.step('Try to open New Post page', async () => {
      await page.goto('/create.html');
      await page.waitForURL(/\/login\.html$/);
      await expect(login.heading).toBeVisible();
    });
  });
});
