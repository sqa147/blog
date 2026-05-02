class CreatePostPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Write a new post' });
    this.title = page.getByLabel('Title');
    this.content = page.getByLabel('Content');
    this.publish = page.getByRole('button', { name: 'Publish' });
    this.error = page.locator('#error');
  }

  async goto() {
    await this.page.goto('/create.html');
  }

  async publishPost({ title, content }) {
    if (title !== undefined) await this.title.fill(title);
    if (content !== undefined) await this.content.fill(content);
    await this.publish.click();
  }
}

module.exports = { CreatePostPage };
