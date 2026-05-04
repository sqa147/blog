class PostDetailPage {
  constructor(page) {
    this.page = page;
    this.container = page.locator('#post');
    this.title = this.container.locator('h1');
    this.meta = this.container.locator('.meta');
    this.content = this.container.locator('.post-content');
    this.deleteBtn = page.getByRole('button', { name: 'Delete', exact: true });
    this.backLink = page.getByRole('link', { name: '← Back to all posts' });
    this.empty = this.container.locator('.empty'); // missing id / not found / fetch fail
    this.errorBanner = page.locator('#error');     // delete failures

    // Comments (added in PR: comments on posts)
    this.commentsSection = page.locator('#comments-section');
    this.commentsHeading = page.locator('#comments-heading');
    this.commentForm = page.locator('#comment-form');
    this.commentInput = page.locator('#comment-content');
    this.commentSubmit = this.commentForm.getByRole('button', { name: 'Post comment', exact: true });
    this.commentLoginPrompt = page.locator('.comment-login-prompt');
    this.commentsList = page.locator('#comments-list');
    this.commentCards = this.commentsList.locator('.comment-card');
    this.commentsEmpty = this.commentsList.locator('.empty');
  }

  commentCard(id) {
    return this.commentsList.locator(`.comment-card[data-id="${id}"]`);
  }

  async submitComment(text) {
    await this.commentInput.fill(text);
    await this.commentSubmit.click();
  }

  async deleteCommentWithConfirm(id, { accept = true } = {}) {
    this.page.once('dialog', (dialog) => {
      if (accept) dialog.accept();
      else dialog.dismiss();
    });
    await this.commentCard(id).locator('.comment-delete').click();
  }

  async goto(id) {
    if (id === undefined || id === null) {
      await this.page.goto('/post.html');
    } else {
      await this.page.goto(`/post.html?id=${id}`);
    }
  }

  async waitLoaded() {
    await this.title.waitFor({ state: 'visible' });
  }

  async deleteWithConfirm({ accept = true } = {}) {
    this.page.once('dialog', (dialog) => {
      if (accept) dialog.accept();
      else dialog.dismiss();
    });
    await this.deleteBtn.click();
    if (accept) {
      await this.page.waitForURL((url) => url.pathname === '/');
    }
  }
}

module.exports = { PostDetailPage };
