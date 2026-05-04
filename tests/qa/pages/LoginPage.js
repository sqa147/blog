class LoginPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Log in' });
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password');
    this.rememberMe = page.locator('#remember-me');
    this.rememberMeRow = page.locator('label.checkbox-row');
    this.submit = page.getByRole('button', { name: 'Log in' });
    this.error = page.locator('#error');
    // Scope to the main content; the nav also has a "Sign up" link.
    this.signupLink = page.locator('main').getByRole('link', { name: 'Sign up', exact: true });
  }

  async goto() {
    await this.page.goto('/login.html');
  }

  async fillAndSubmit({ email, password, rememberMe }) {
    if (email !== undefined) await this.email.fill(email);
    if (password !== undefined) await this.password.fill(password);
    if (rememberMe === true) await this.rememberMe.check();
    if (rememberMe === false) await this.rememberMe.uncheck();
    await this.submit.click();
  }
}

module.exports = { LoginPage };
