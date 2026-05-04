// M6 — Post Detail
// Covers TC-PDT-01..10 (post rendering & ownership) and
// TC-PDT-11..21 (comments feature added by this PR).
const { test, expect } = require('@playwright/test');
const { PostDetailPage } = require('../pages/PostDetailPage');
const { HomePage } = require('../pages/HomePage');
const { users, ts } = require('../data/testData');
const { apiSignup, setSession, clearSession } = require('../helpers/auth');
const { apiCreatePost } = require('../helpers/posts');
const { apiCreateComment, apiListComments, apiDeleteComment } = require('../helpers/comments');

test.describe('M6 Post Detail', () => {
  test('TC-PDT-01: Existing post displays title, author, date, and full content @smoke', async ({ page, request }) => {
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

  test('TC-PDT-02: Post detail page shows a clear message when no post is selected @regression', async ({ page }) => {
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

  test('TC-PDT-03: Opening a non-existent post shows a not-found message @regression', async ({ page }) => {
    const detail = new PostDetailPage(page);

    await test.step('Open detail with a non-existent reference', async () => {
      console.log('[TC-PDT-03] id 999999');
      await detail.goto(999999);
    });

    await test.step('"Failed to load post: Post not found" is shown', async () => {
      await expect(detail.empty).toContainText(/Failed to load post: Post not found/i);
    });
  });

  test('TC-PDT-04: Opening a post with an invalid reference shows a not-found message @regression', async ({ page }) => {
    const detail = new PostDetailPage(page);

    await test.step('Open detail with a non-numeric reference', async () => {
      console.log('[TC-PDT-04] id abc');
      await detail.goto('abc');
    });

    await test.step('Not-found message is shown', async () => {
      await expect(detail.empty).toContainText(/Failed to load post: Post not found/i);
    });
  });

  test('TC-PDT-05: Author sees the Delete button on their own post @smoke', async ({ page, request }) => {
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

  test('TC-PDT-06: Visitor does not see the Delete button @regression', async ({ page, request }) => {
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

  test('TC-PDT-07: Logged-in user does not see Delete on someone else\'s post @regression', async ({ page, request }) => {
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

  test('TC-PDT-08: Title containing HTML-like text is shown safely @regression', async ({ page, request }) => {
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

  test('TC-PDT-09: Content with line breaks and special characters is shown safely @regression', async ({ page, request }) => {
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

  test('TC-PDT-10: "Back to all posts" link returns the user to the home page @regression', async ({ page, request }) => {
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

  // ─────────────────────────────────────────────────────────────────────
  // Comments feature (added in this PR)
  // ─────────────────────────────────────────────────────────────────────

  test('TC-PDT-11: Comments section is visible with empty-state message when post has none @smoke', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `No comments ${ts()}`, content: 'body' });
    const detail = new PostDetailPage(page);

    await test.step('Open the post as a visitor', async () => {
      console.log('[TC-PDT-11] open post with zero comments');
      await detail.goto(post.id);
      await detail.waitLoaded();
    });

    await test.step('Comments section heading and empty state are shown', async () => {
      await expect(detail.commentsSection).toBeVisible();
      await expect(detail.commentsHeading).toHaveText('Comments (0)');
      await expect(detail.commentsEmpty).toContainText(/No comments yet/i);
      await expect(detail.commentCards).toHaveCount(0);
    });
  });

  test('TC-PDT-12: Visitor sees a login prompt instead of the comment form @smoke', async ({ page, request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Visitor view ${ts()}`, content: 'body' });
    await clearSession(page); // ensure visitor
    const detail = new PostDetailPage(page);

    await detail.goto(post.id);
    await detail.waitLoaded();

    await test.step('Login prompt visible, comment form hidden', async () => {
      console.log('[TC-PDT-12] visitor — login prompt');
      await expect(detail.commentLoginPrompt).toBeVisible();
      await expect(detail.commentLoginPrompt.getByRole('link', { name: /Log in/i })).toBeVisible();
      await expect(detail.commentForm).toHaveCount(0);
    });
  });

  test('TC-PDT-13: Logged-in user can post a comment and it appears in the list @smoke', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Add comment ${ts()}`, content: 'body' });
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);

    await detail.goto(post.id);
    await detail.waitLoaded();

    const text = `Great post! ${ts()}`;
    await test.step('Submit a new comment', async () => {
      console.log('[TC-PDT-13] submit comment');
      await expect(detail.commentForm).toBeVisible();
      await detail.submitComment(text);
    });

    await test.step('Comment appears, count updates, input is cleared', async () => {
      await expect(detail.commentsHeading).toHaveText('Comments (1)');
      await expect(detail.commentCards).toHaveCount(1);
      const card = detail.commentCards.first();
      await expect(card.locator('.meta')).toContainText(user.username);
      await expect(card.locator('.comment-content')).toHaveText(text);
      await expect(detail.commentInput).toHaveValue('');
    });
  });

  test('TC-PDT-14: Empty / whitespace-only comment is rejected (HTML required + server trim) @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Empty comment ${ts()}`, content: 'body' });
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);

    await detail.goto(post.id);
    await detail.waitLoaded();

    await test.step('Clicking submit with empty textarea does not submit', async () => {
      console.log('[TC-PDT-14] empty submit');
      await detail.commentSubmit.click();
      // browser HTML5 validation blocks submission
      await expect(detail.commentsHeading).toHaveText('Comments (0)');
    });

    await test.step('Server rejects whitespace-only via API', async () => {
      const res = await request.post(`/api/posts/${post.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { content: '   \n   ' },
      });
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/content is required/i);
    });
  });

  test('TC-PDT-15: Comments are listed oldest-first and counter reflects total @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Ordering ${ts()}`, content: 'body' });
    await apiCreateComment(request, token, post.id, 'first');
    await apiCreateComment(request, token, post.id, 'second');
    await apiCreateComment(request, token, post.id, 'third');
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);

    await detail.goto(post.id);
    await detail.waitLoaded();

    await test.step('Counter and order match', async () => {
      console.log('[TC-PDT-15] ordering');
      await expect(detail.commentsHeading).toHaveText('Comments (3)');
      const texts = await detail.commentCards.locator('.comment-content').allTextContents();
      expect(texts).toEqual(['first', 'second', 'third']);
    });
  });

  test('TC-PDT-16: Author of a comment can delete it; counter updates @smoke', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Delete own ${ts()}`, content: 'body' });
    const c1 = await apiCreateComment(request, token, post.id, 'mine to remove');
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);

    await detail.goto(post.id);
    await detail.waitLoaded();
    await expect(detail.commentCards).toHaveCount(1);

    await test.step('Confirm and delete', async () => {
      console.log('[TC-PDT-16] delete own comment', c1.id);
      await detail.deleteCommentWithConfirm(c1.id, { accept: true });
    });

    await test.step('Comment is gone, counter resets to 0', async () => {
      await expect(detail.commentCards).toHaveCount(0);
      await expect(detail.commentsHeading).toHaveText('Comments (0)');
      await expect(detail.commentsEmpty).toBeVisible();
    });
  });

  test('TC-PDT-17: User cannot see a Delete button on someone else\'s comment @regression', async ({ page, request }) => {
    const author = users.primary();
    const other = users.secondary();
    const { token: aToken } = await apiSignup(request, author);
    const post = await apiCreatePost(request, aToken, { title: `Other comment ${ts()}`, content: 'body' });
    const c1 = await apiCreateComment(request, aToken, post.id, 'authored by Ali');

    const { token: oToken, user: oUser } = await apiSignup(request, other);
    await setSession(page, oToken, oUser);
    const detail = new PostDetailPage(page);

    await detail.goto(post.id);
    await detail.waitLoaded();

    await test.step('Comment is shown but no delete button', async () => {
      console.log('[TC-PDT-17] non-author view of comment', c1.id);
      await expect(detail.commentCard(c1.id)).toBeVisible();
      await expect(detail.commentCard(c1.id).locator('.comment-delete')).toHaveCount(0);
    });
  });

  test('TC-PDT-18: API blocks deleting a comment owned by another user @regression', async ({ request }) => {
    const author = users.primary();
    const other = users.secondary();
    const { token: aToken } = await apiSignup(request, author);
    const post = await apiCreatePost(request, aToken, { title: `Cross-delete ${ts()}`, content: 'body' });
    const c1 = await apiCreateComment(request, aToken, post.id, 'mine');

    const { token: oToken } = await apiSignup(request, other);
    const res = await apiDeleteComment(request, oToken, post.id, c1.id);

    console.log('[TC-PDT-18] cross-user delete →', res.status());
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/only delete your own/i);

    const list = await apiListComments(request, post.id);
    expect(list.length).toBe(1);
  });

  test('TC-PDT-19: Comment with HTML-like text is rendered as plain text (XSS-safe) @regression', async ({ page, request }) => {
    const u = users.primary();
    const { token, user } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `XSS ${ts()}`, content: 'body' });
    const tricky = '<img src=x onerror=alert(1)> & <script>alert(2)</script>';
    let dialogOpened = false;
    page.on('dialog', () => { dialogOpened = true; });

    await apiCreateComment(request, token, post.id, tricky);
    await setSession(page, token, user);
    const detail = new PostDetailPage(page);

    await detail.goto(post.id);
    await detail.waitLoaded();

    await test.step('Comment shown as plain text — no img/script element, no popup', async () => {
      console.log('[TC-PDT-19] xss in comment');
      const card = detail.commentCards.first();
      await expect(card.locator('.comment-content')).toHaveText(tricky);
      await expect(card.locator('img')).toHaveCount(0);
      await expect(card.locator('script')).toHaveCount(0);
      expect(dialogOpened).toBe(false);
    });
  });

  test('TC-PDT-20: Comment of exactly 2000 chars is accepted; 2001 chars is rejected @regression', async ({ request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `Boundary ${ts()}`, content: 'body' });

    const ok = 'a'.repeat(2000);
    const okComment = await apiCreateComment(request, token, post.id, ok);
    expect(okComment.content.length).toBe(2000);

    const tooLong = 'a'.repeat(2001);
    const res = await request.post(`/api/posts/${post.id}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { content: tooLong },
    });
    console.log('[TC-PDT-20] 2001 chars →', res.status());
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/too long/i);
  });

  test('TC-PDT-21: Posting a comment without a token is rejected @regression', async ({ request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);
    const post = await apiCreatePost(request, token, { title: `No auth ${ts()}`, content: 'body' });

    const res = await request.post(`/api/posts/${post.id}/comments`, {
      data: { content: 'try' },
    });
    console.log('[TC-PDT-21] no-auth →', res.status());
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/missing token/i);
  });

  test('TC-PDT-22: Posting a comment to an unknown post returns 404 @regression', async ({ request }) => {
    const u = users.primary();
    const { token } = await apiSignup(request, u);

    const res = await request.post('/api/posts/999999/comments', {
      headers: { Authorization: `Bearer ${token}` },
      data: { content: 'ghost' },
    });
    console.log('[TC-PDT-22] post not found →', res.status());
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/post not found/i);
  });
});
