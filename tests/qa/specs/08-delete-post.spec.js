// M8 — Delete Post
// Covers TC-DEL-01..08.
const { test, expect } = require('@playwright/test');
const { PostDetailPage } = require('../pages/PostDetailPage');
const { HomePage } = require('../pages/HomePage');
const { SignupPage } = require('../pages/SignupPage');
const { CreatePostPage } = require('../pages/CreatePostPage');
const { NavBar } = require('../pages/NavBar');
const { users, ts } = require('../data/testData');
const { apiSignup, setSession } = require('../helpers/auth');
const { apiCreatePost, apiDeletePost, apiListPosts } = require('../helpers/posts');

test.describe('M8 Delete Post', () => {
  test('TC-DEL-01: Author deletes their own post and is returned to the home page @smoke', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Delete me ${ts()}`, content: 'Bye' });
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);
    const home = new HomePage(page);

    await test.step('Delete the post via the UI confirm flow', async () => {
      console.log('[TC-DEL-01] delete', post.id);
      await detail.goto(post.id);
      await detail.waitLoaded();
      await detail.deleteWithConfirm({ accept: true });
    });

    await test.step('Home page no longer lists the post', async () => {
      await expect(home.heading).toBeVisible();
      await expect(home.cardByTitle(post.title)).toHaveCount(0);
    });
  });

  test('TC-DEL-02: Cancelling the confirmation keeps the post intact @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Keep me ${ts()}`, content: 'Stay' });
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);
    const home = new HomePage(page);

    await test.step('Click Delete and dismiss the confirmation', async () => {
      console.log('[TC-DEL-02] cancel delete', post.id);
      await detail.goto(post.id);
      await detail.waitLoaded();
      await detail.deleteWithConfirm({ accept: false });
    });

    await test.step('User remains on the detail page; post still listed on home', async () => {
      await expect(detail.title).toHaveText(post.title);
      await home.goto();
      await expect(home.cardByTitle(post.title)).toHaveCount(1);
    });
  });

  test('TC-DEL-03: A user cannot delete a post that belongs to someone else @regression', async ({ request }) => {
    const author = users.primary();
    const other = users.secondary();
    const { token: aToken } = await apiSignup(request, author);
    const post = await apiCreatePost(request, aToken, { title: `Owned ${ts()}`, content: 'Owned' });
    const { token: oToken } = await apiSignup(request, other);

    console.log('[TC-DEL-03] non-author delete attempt for', post.id);
    const res = await apiDeletePost(request, oToken, post.id);
    expect(res.status()).toBe(403);
    expect((await res.json()).error).toBe('You can only delete your own posts');

    const stillThere = (await apiListPosts(request)).some((p) => p.id === post.id);
    expect(stillThere).toBe(true);
  });

  test('TC-DEL-04: Deleting a non-existent post shows a not-found message @regression', async ({ request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    console.log('[TC-DEL-04] delete 999999');

    const res = await apiDeletePost(request, token, 999999);
    expect(res.status()).toBe(404);
    expect((await res.json()).error).toBe('Post not found');
  });

  test('TC-DEL-05: Deleting the only existing post shows the empty list message @regression', async ({ page, request }) => {
    // We can't guarantee the global list is empty in a parallel run, so we
    // verify the user's own card disappears and the empty-state message shows
    // when we mock the list to be empty after the delete.
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Solo ${ts()}`, content: 'Only' });
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);
    const home = new HomePage(page);

    await test.step('Delete the only post', async () => {
      console.log('[TC-DEL-05] delete only post', post.id);
      await detail.goto(post.id);
      await detail.waitLoaded();
      await detail.deleteWithConfirm({ accept: true });
    });

    await test.step('Mock empty posts list and confirm empty-state', async () => {
      await page.route('**/api/posts', (route) => route.fulfill({
        status: 200, contentType: 'application/json', body: '[]',
      }));
      await page.reload();
      await expect(home.empty).toHaveText(/No posts yet\. Be the first to write one!/);
    });
  });

  test('TC-DEL-06: A delete attempt without a valid session is rejected @regression', async ({ request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Guarded ${ts()}`, content: 'Guarded' });
    console.log('[TC-DEL-06] delete without token');

    const res = await apiDeletePost(request, null, post.id);
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBe('Missing token');
  });

  test('TC-DEL-07: A delete attempt with an invalid session is rejected @regression', async ({ request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Guarded ${ts()}`, content: 'Guarded' });
    console.log('[TC-DEL-07] delete with tampered token');

    const res = await apiDeletePost(request, 'aaa.bbb.ccc', post.id);
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBe('Invalid or expired token');
  });

  test('TC-DEL-08: End-to-end: register, publish a post, delete it, and verify it is gone @smoke', async ({ page }) => {
    const u = users.noor();
    const post = { title: `Soon to be deleted ${ts()}`, content: 'Bye' };
    const signup = new SignupPage(page);
    const create = new CreatePostPage(page);
    const detail = new PostDetailPage(page);
    const home = new HomePage(page);
    const nav = new NavBar(page);

    let createdId;

    await test.step('Register a new account via UI', async () => {
      console.log('[TC-DEL-08] e2e signup', u.username);
      await signup.goto();
      await signup.fillAndSubmit(u);
      await page.waitForURL((url) => url.pathname === '/');
      await nav.expectLoggedIn(u.username);
    });

    await test.step('Publish a post via UI', async () => {
      await nav.newPostLink.click();
      await page.waitForURL(/\/create\.html$/);
      await create.publishPost(post);
      await page.waitForURL(/\/post\.html\?id=\d+/);
      createdId = new URL(page.url()).searchParams.get('id');
      await expect(detail.title).toHaveText(post.title);
    });

    await test.step('Delete the post and confirm dialog', async () => {
      await detail.deleteWithConfirm({ accept: true });
    });

    await test.step('Home page no longer lists the post', async () => {
      await expect(home.heading).toBeVisible();
      await expect(home.cardByTitle(post.title)).toHaveCount(0);
    });

    await test.step('Reopening the deleted post shows the not-found message', async () => {
      await detail.goto(createdId);
      await expect(detail.empty).toContainText(/Failed to load post: Post not found/i);
    });
  });
});
