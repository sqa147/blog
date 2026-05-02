// Top-navigation page object — present on every page in the app.
class NavBar {
  constructor(page) {
    this.page = page;
    const navLinks = page.locator('#nav-links');
    this.brand = page.locator('nav a.brand');
    this.loginLink = navLinks.getByRole('link', { name: 'Login', exact: true });
    this.signupLink = navLinks.getByRole('link', { name: 'Sign up', exact: true });
    this.newPostLink = navLinks.getByRole('link', { name: 'New Post', exact: true });
    this.logoutBtn = navLinks.getByRole('button', { name: 'Logout', exact: true });
    this.greeting = navLinks.locator('span.muted-link');
  }

  greetingFor(username) {
    return this.page.getByText(`Hi, ${username}`, { exact: true });
  }

  async expectVisitor() {
    await this.loginLink.waitFor({ state: 'visible' });
    await this.signupLink.waitFor({ state: 'visible' });
  }

  async expectLoggedIn(username) {
    await this.newPostLink.waitFor({ state: 'visible' });
    await this.logoutBtn.waitFor({ state: 'visible' });
    if (username) {
      await this.greetingFor(username).waitFor({ state: 'visible' });
    }
  }

  async logout() {
    await this.logoutBtn.click();
    await this.page.waitForURL((url) => url.pathname === '/');
  }
}

module.exports = { NavBar };
