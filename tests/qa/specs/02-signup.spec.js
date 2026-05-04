// M2 — Sign Up
// Covers TC-SUP-01..14.
const { test, expect } = require('@playwright/test');
const { SignupPage } = require('../pages/SignupPage');
const { LoginPage } = require('../pages/LoginPage');
const { NavBar } = require('../pages/NavBar');
const { HomePage } = require('../pages/HomePage');
const { users, ts } = require('../data/testData');
const { apiSignup, ensureSignedIn } = require('../helpers/auth');

test.describe('M2 Sign Up', () => {
  test('TC-SUP-01: User registers a new account with valid details @smoke', async ({ page }) => {
    const u = users.primary();
    const signup = new SignupPage(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);

    await test.step('Open the Sign Up page', async () => {
      console.log('[TC-SUP-01] sign up', u.username);
      await signup.goto();
      await expect(signup.heading).toBeVisible();
    });

    await test.step('Submit valid details', async () => {
      await signup.fillAndSubmit(u);
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('Verify the user is logged in on the home page', async () => {
      await expect(home.heading).toBeVisible();
      await nav.expectLoggedIn(u.username);
    });
  });

  test('TC-SUP-02: Sign Up form blocks submission when no fields are filled @regression', async ({ page }) => {
    const signup = new SignupPage(page);

    await test.step('Click Sign up without filling any field', async () => {
      console.log('[TC-SUP-02] submit empty');
      await signup.goto();
      await signup.submitForm();
    });

    await test.step('URL stays on Sign Up and Username is invalid', async () => {
      expect(new URL(page.url()).pathname).toBe('/signup.html');
      const valueMissing = await signup.username.evaluate((el) => el.validity.valueMissing);
      expect(valueMissing).toBe(true);
    });
  });

  test('TC-SUP-03: Validation message shown when required fields are missing @regression', async ({ request }) => {
    console.log('[TC-SUP-03] empty body to signup');
    const res = await request.post('/api/auth/signup', { data: {} });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('username, email and password are required');
  });

  test('TC-SUP-04: Password with exactly six characters is accepted @regression', async ({ page }) => {
    const u = users.fatima(); // password: abc123
    const signup = new SignupPage(page);
    const nav = new NavBar(page);

    await test.step('Sign up with a 6-char password', async () => {
      console.log('[TC-SUP-04] sign up', u.username);
      await signup.goto();
      await signup.fillAndSubmit(u);
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('Greeting is shown', async () => {
      await nav.expectLoggedIn(u.username);
    });
  });

  test('TC-SUP-05: Password shorter than six characters is rejected @regression', async ({ page }) => {
    const u = users.fatima();
    u.password = 'Ali@1'; // 5 chars
    const signup = new SignupPage(page);

    await test.step('Bypass HTML5 minlength and submit', async () => {
      console.log('[TC-SUP-05] sign up with 5-char password');
      await signup.goto();
      await signup.fill({ username: u.username, email: u.email });
      await signup.setPasswordRaw(u.password);
      await signup.submitForm();
    });

    await test.step('Server validation message is displayed', async () => {
      await expect(signup.error).toContainText(/at least 6 characters/i);
      expect(new URL(page.url()).pathname).toBe('/signup.html');
    });
  });

  test('TC-SUP-06: Username shorter than three characters is not accepted @regression', async ({ page }) => {
    const u = users.primary();
    u.username = 'ab';
    const signup = new SignupPage(page);

    await test.step('Submit with username of 2 characters', async () => {
      console.log('[TC-SUP-06] sign up with 2-char username');
      await signup.goto();
      await signup.fillAndSubmit(u);
    });

    await test.step('Form did not submit, username is invalid', async () => {
      expect(new URL(page.url()).pathname).toBe('/signup.html');
      const tooShort = await signup.username.evaluate((el) => el.validity.tooShort);
      expect(tooShort).toBe(true);
    });
  });

  test('TC-SUP-07: Username field stops accepting input after thirty characters @regression', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    await test.step('Type 31 characters into Username', async () => {
      console.log('[TC-SUP-07] type 31 chars');
      await signup.username.click();
      await signup.username.pressSequentially('a'.repeat(31), { delay: 0 });
    });

    await test.step('Only 30 characters are accepted', async () => {
      const value = await signup.username.inputValue();
      expect(value.length).toBe(30);
      expect(await signup.username.getAttribute('maxlength')).toBe('30');
    });
  });

  test('TC-SUP-08: Sign up rejected when the email is already registered @regression', async ({ page, request }) => {
    const seed = users.primary();
    await apiSignup(request, seed);
    const dupe = { ...seed, username: `${seed.username}.x`.slice(0, 30) };
    const signup = new SignupPage(page);

    await test.step('Submit with the seeded email', async () => {
      console.log('[TC-SUP-08] dupe email', seed.email);
      await signup.goto();
      await signup.fillAndSubmit(dupe);
    });

    await test.step('Validation message is displayed', async () => {
      await expect(signup.error).toContainText(/Username or email already in use/i);
      expect(new URL(page.url()).pathname).toBe('/signup.html');
    });
  });

  test('TC-SUP-09: Sign up rejected when the username is already registered @regression', async ({ page, request }) => {
    const seed = users.primary();
    await apiSignup(request, seed);
    const dupe = { ...seed, email: `new.${ts()}@miniblog.test` };
    const signup = new SignupPage(page);

    await test.step('Submit with the seeded username', async () => {
      console.log('[TC-SUP-09] dupe username', seed.username);
      await signup.goto();
      await signup.fillAndSubmit(dupe);
    });

    await test.step('Validation message is displayed', async () => {
      await expect(signup.error).toContainText(/Username or email already in use/i);
    });
  });

  test('TC-SUP-10: Username and email saved without leading or trailing spaces @regression', async ({ page }) => {
    const stamp = ts();
    const padded = {
      username: `  bilal.dev.${stamp}  `,
      email: `  bilal.${stamp}@miniblog.test  `,
      password: 'Passw0rd!',
    };
    const trimmedUsername = padded.username.trim().slice(0, 30);
    const signup = new SignupPage(page);
    const nav = new NavBar(page);

    await test.step('Sign up with padded values', async () => {
      console.log('[TC-SUP-10] padded sign up');
      await signup.goto();
      await signup.fillAndSubmit(padded);
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('Greeting shows the trimmed username', async () => {
      await expect(nav.greetingFor(trimmedUsername)).toBeVisible();
    });
  });

  test('TC-SUP-11: Sign up does not accept an invalid email format @regression', async ({ page }) => {
    const u = users.primary();
    u.email = 'ali.khan.gmail.com'; // no @
    const signup = new SignupPage(page);

    await test.step('Submit with an invalid email format', async () => {
      console.log('[TC-SUP-11] invalid email');
      await signup.goto();
      await signup.fillAndSubmit(u);
    });

    await test.step('Form did not submit, email is invalid', async () => {
      expect(new URL(page.url()).pathname).toBe('/signup.html');
      const typeMismatch = await signup.email.evaluate((el) => el.validity.typeMismatch);
      expect(typeMismatch).toBe(true);
    });
  });

  test('TC-SUP-12: Logged-in user is redirected away from the Sign Up page @regression', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());

    await test.step('Open Sign Up while logged in', async () => {
      console.log('[TC-SUP-12] redirect away');
      await page.goto('/signup.html');
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('Sign Up form is not shown', async () => {
      await expect(page.getByRole('heading', { name: 'Create your account' })).toBeHidden();
    });
  });

  test('TC-SUP-13: User remains logged in after refreshing the page @regression', async ({ page }) => {
    const u = users.primary();
    const signup = new SignupPage(page);
    const nav = new NavBar(page);

    await test.step('Sign up and reach home', async () => {
      console.log('[TC-SUP-13] sign up + reload');
      await signup.goto();
      await signup.fillAndSubmit(u);
      await page.waitForURL((url) => url.pathname === '/');
      await nav.expectLoggedIn(u.username);
    });

    await test.step('Reload the page and remain logged in', async () => {
      await page.reload();
      await nav.expectLoggedIn(u.username);
    });
  });

  test('TC-SUP-14: "Already have an account? Log in" link opens the Login page @regression', async ({ page }) => {
    const signup = new SignupPage(page);
    const login = new LoginPage(page);
    await signup.goto();

    await test.step('Click the Log in link', async () => {
      console.log('[TC-SUP-14] click Log in link');
      await signup.loginLink.click();
      await page.waitForURL(/\/login\.html$/);
    });

    await test.step('Login page is shown', async () => {
      await expect(login.heading).toBeVisible();
    });
  });
});
