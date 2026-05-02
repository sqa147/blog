class SignupPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Create your account' });
    this.username = page.getByLabel('Username');
    this.email = page.getByLabel('Email');
    this.password = page.getByLabel('Password (min 6 chars)');
    this.submit = page.getByRole('button', { name: 'Sign up' });
    this.error = page.locator('#error');
    // Main has "Log in"; nav anonymous has "Login" — different text, but scope anyway.
    this.loginLink = page.locator('main').getByRole('link', { name: 'Log in', exact: true });
  }

  async goto() {
    await this.page.goto('/signup.html');
  }

  async fill({ username, email, password }) {
    if (username !== undefined) await this.username.fill(username);
    if (email !== undefined) await this.email.fill(email);
    if (password !== undefined) await this.password.fill(password);
  }

  async submitForm() {
    await this.submit.click();
  }

  async fillAndSubmit(data) {
    await this.fill(data);
    await this.submitForm();
  }

  // Bypass the native HTML5 minlength check to verify server-side validation.
  async setPasswordRaw(value) {
    await this.password.evaluate((el, v) => {
      el.value = v;
    }, value);
  }
}

module.exports = { SignupPage };
