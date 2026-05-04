// M1 — Top Navigation
// Covers TC-NAV-01..06 against the auth-aware top navigation.
const { test, expect } = require('@playwright/test');
const { NavBar } = require('../pages/NavBar');
const { HomePage } = require('../pages/HomePage');
const { SignupPage } = require('../pages/SignupPage');
const { CreatePostPage } = require('../pages/CreatePostPage');
const { PostDetailPage } = require('../pages/PostDetailPage');
const { users, ts } = require('../data/testData');
const { apiSignup, ensureSignedIn } = require('../helpers/auth');
const { apiCreatePost } = require('../helpers/posts');

test.describe('M1 Top Navigation', () => {
  test('TC-NAV-01: Visitor sees Login and Sign Up options in the top menu @smoke', async ({ page }) => {
    const nav = new NavBar(page);
    const home = new HomePage(page);

    await test.step('Open the home page as a visitor', async () => {
      console.log('[TC-NAV-01] open home page');
      await home.goto();
    });

    await test.step('Visitor links visible, author links hidden', async () => {
      await nav.expectVisitor();
      await expect(nav.newPostLink).toBeHidden();
      await expect(nav.logoutBtn).toBeHidden();
      await expect(nav.greeting).toHaveCount(0);
    });
  });

  test('TC-NAV-02: Logged-in user sees New Post, greeting, and Logout @smoke', async ({ page, request }) => {
    const u = users.primary();
    const nav = new NavBar(page);
    const home = new HomePage(page);

    await test.step('Sign up via API and inject session', async () => {
      console.log('[TC-NAV-02] sign up', u.username);
      await ensureSignedIn(page, request, u);
    });

    await test.step('Open home page and verify logged-in nav', async () => {
      await home.goto();
      await nav.expectLoggedIn(u.username);
      await expect(nav.loginLink).toBeHidden();
      await expect(nav.signupLink).toBeHidden();
    });
  });

  test('TC-NAV-03: Username with special characters is shown safely in the greeting @regression', async ({ page }) => {
    const stamp = ts();
    const trickyUser = {
      username: `Ali<${stamp}>`.slice(0, 30),
      email: `ali.${stamp}@miniblog.test`,
      password: 'Passw0rd!',
    };
    const signup = new SignupPage(page);
    const nav = new NavBar(page);

    await test.step('Sign up using a username that contains < and >', async () => {
      console.log('[TC-NAV-03] sign up tricky user', trickyUser.username);
      await signup.goto();
      await signup.fillAndSubmit(trickyUser);
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('Greeting renders the special characters as plain text', async () => {
      await expect(nav.greetingFor(trickyUser.username)).toBeVisible();
      const innerHtml = await nav.greeting.innerHTML();
      expect(innerHtml).toContain('&lt;');
      expect(innerHtml).toContain('&gt;');
      expect(innerHtml.toLowerCase()).not.toMatch(/<ali</);
    });
  });

  test('TC-NAV-04: User returns to the home page from the New Post page using the logo @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());
    const create = new CreatePostPage(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);

    await test.step('Open the New Post page', async () => {
      console.log('[TC-NAV-04] open New Post page');
      await create.goto();
      await expect(create.heading).toBeVisible();
    });

    await test.step('Click the MiniBlog logo and land on home', async () => {
      await nav.brand.click();
      await page.waitForURL((url) => url.pathname === '/');
      await expect(home.heading).toBeVisible();
    });
  });

  test('TC-NAV-05: User returns to the home page from a post detail page using the logo @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Welcome ${ts()}`, content: 'Hello world' });
    const nav = new NavBar(page);
    const detail = new PostDetailPage(page);
    const home = new HomePage(page);

    await test.step('Open the post detail page', async () => {
      console.log('[TC-NAV-05] open post', post.id);
      await detail.goto(post.id);
      await detail.waitLoaded();
    });

    await test.step('Click the logo and land on home', async () => {
      await nav.brand.click();
      await page.waitForURL((url) => url.pathname === '/');
      await expect(home.heading).toBeVisible();
    });
  });

  test('TC-NAV-06: Logout button is hidden when the user is not logged in @regression', async ({ page }) => {
    const nav = new NavBar(page);
    for (const path of ['/', '/signup.html', '/login.html']) {
      await test.step(`Verify visitor view on ${path}`, async () => {
        console.log('[TC-NAV-06] check', path);
        await page.goto(path);
        await expect(nav.logoutBtn).toBeHidden();
      });
    }
  });
});
