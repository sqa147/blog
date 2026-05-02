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
