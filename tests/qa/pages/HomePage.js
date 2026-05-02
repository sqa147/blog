class HomePage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Latest posts' });
    this.posts = page.locator('#posts');
    this.postCards = this.posts.locator('article.post-card');
    this.empty = this.posts.locator('.empty');
  }

  async goto() {
    await this.page.goto('/');
    await this.heading.waitFor({ state: 'visible' });
  }

  cardByTitle(title) {
    return this.postCards.filter({
      has: this.page.getByRole('link', { name: title, exact: true }),
    });
  }

  async openByTitle(title) {
    await this.cardByTitle(title)
      .getByRole('link', { name: title, exact: true })
      .click();
    await this.page.waitForURL(/\/post\.html\?id=\d+/);
  }
}

module.exports = { HomePage };
