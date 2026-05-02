// M3 — Login
// Covers TC-LGN-01..10.
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { SignupPage } = require('../pages/SignupPage');
const { NavBar } = require('../pages/NavBar');
const { HomePage } = require('../pages/HomePage');
const { users } = require('../data/testData');
const { apiSignup, ensureSignedIn } = require('../helpers/auth');

test.describe('M3 Login', () => {
  test('TC-LGN-01: User logs in with correct email and password', async ({ page, request }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);

    await test.step('Submit correct credentials', async () => {
      console.log('[TC-LGN-01] login as', u.email);
      await login.goto();
      await login.fillAndSubmit({ email: u.email, password: u.password });
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('User is on the home page and logged in', async () => {
      await expect(home.heading).toBeVisible();
      await nav.expectLoggedIn(u.username);
    });
  });

  test('TC-LGN-02: Login form blocks submission when no fields are filled', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await test.step('Click Log in without filling fields', async () => {
      console.log('[TC-LGN-02] submit empty');
      await login.submit.click();
    });

    await test.step('URL stays on Login and Email is invalid', async () => {
      expect(new URL(page.url()).pathname).toBe('/login.html');
      const valueMissing = await login.email.evaluate((el) => el.validity.valueMissing);
      expect(valueMissing).toBe(true);
    });
  });

  test('TC-LGN-03: Validation message shown when required fields are missing', async ({ request }) => {
    console.log('[TC-LGN-03] empty body to login');
    const res = await request.post('/api/auth/login', { data: {} });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('email and password are required');
  });

  test('TC-LGN-04: Login is rejected when the password is incorrect', async ({ page, request }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);

    await test.step('Submit with the wrong password', async () => {
      console.log('[TC-LGN-04] wrong password for', u.email);
      await login.goto();
      await login.fillAndSubmit({ email: u.email, password: 'WrongPass1' });
    });

    await test.step('Validation message is displayed', async () => {
      await expect(login.error).toContainText(/Invalid email or password/i);
      expect(new URL(page.url()).pathname).toBe('/login.html');
    });
  });

  test('TC-LGN-05: Login is rejected when the email is not registered', async ({ page }) => {
    const login = new LoginPage(page);

    await test.step('Submit with an unregistered email', async () => {
      console.log('[TC-LGN-05] unknown email');
      await login.goto();
      await login.fillAndSubmit({ email: 'ghost.user@miniblog.test', password: 'AnyPass1' });
    });

    await test.step('Validation message is displayed', async () => {
      await expect(login.error).toContainText(/Invalid email or password/i);
    });
  });

  test('TC-LGN-06: Login fails when the email casing does not match', async ({ page, request }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);

    await test.step('Submit with uppercased email', async () => {
      console.log('[TC-LGN-06] case sensitivity');
      await login.goto();
      await login.fillAndSubmit({ email: u.email.toUpperCase(), password: u.password });
    });

    await test.step('Validation message is displayed', async () => {
      await expect(login.error).toContainText(/Invalid email or password/i);
    });
  });

  test('TC-LGN-07: Email is accepted even with extra spaces around it', async ({ page, request }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);
    const home = new HomePage(page);

    await test.step('Submit with padded email', async () => {
      console.log('[TC-LGN-07] padded email');
      await login.goto();
      await login.fillAndSubmit({ email: `  ${u.email}  `, password: u.password });
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('User reaches the home page', async () => {
      await expect(home.heading).toBeVisible();
    });
  });

  test('TC-LGN-08: User remains logged in after refreshing the page', async ({ page, request }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);
    const nav = new NavBar(page);

    await test.step('Login via UI', async () => {
      console.log('[TC-LGN-08] login + reload');
      await login.goto();
      await login.fillAndSubmit({ email: u.email, password: u.password });
      await page.waitForURL((url) => url.pathname === '/');
      await nav.expectLoggedIn(u.username);
    });

    await test.step('Reload home and remain logged in', async () => {
      await page.reload();
      await nav.expectLoggedIn(u.username);
    });
  });

  test('TC-LGN-09: Logged-in user is redirected away from the Login page', async ({ page, request }) => {
    await ensureSignedIn(page, request, users.primary());

    await test.step('Open Login while logged in', async () => {
      console.log('[TC-LGN-09] redirect away');
      await page.goto('/login.html');
      await page.waitForURL((url) => url.pathname === '/');
    });

    await test.step('Login form is not shown', async () => {
      await expect(page.getByRole('heading', { name: 'Log in' })).toBeHidden();
    });
  });

  test('TC-LGN-10: "Don\'t have an account? Sign up" link opens the Sign Up page', async ({ page }) => {
    const login = new LoginPage(page);
    const signup = new SignupPage(page);
    await login.goto();

    await test.step('Click the Sign up link', async () => {
      console.log('[TC-LGN-10] click Sign up link');
      await login.signupLink.click();
      await page.waitForURL(/\/signup\.html$/);
    });

    await test.step('Sign Up page is shown', async () => {
      await expect(signup.heading).toBeVisible();
    });
  });
});
