// M3 — Login
// Covers TC-LGN-01..22 (TC-LGN-11..22 cover the Remember me checkbox,
// added with PR de4575a).
const { test, expect } = require('@playwright/test');
const jwt = require('jsonwebtoken');
const { LoginPage } = require('../pages/LoginPage');
const { SignupPage } = require('../pages/SignupPage');
const { NavBar } = require('../pages/NavBar');
const { HomePage } = require('../pages/HomePage');
const { users } = require('../data/testData');
const { apiSignup, ensureSignedIn } = require('../helpers/auth');

const ONE_DAY_S = 24 * 60 * 60;
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

async function readTokenStorage(page) {
  return page.evaluate(() => ({
    local: localStorage.getItem('token'),
    session: sessionStorage.getItem('token'),
    localUser: localStorage.getItem('user'),
    sessionUser: sessionStorage.getItem('user'),
  }));
}

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

  // ── Remember me (PR de4575a) ─────────────────────────────────────────
  // UI presence/state, client-side storage tier, JWT TTL on the backend,
  // and credential validation regression.
  test('TC-LGN-11: Remember me checkbox is visible on the Login page', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.rememberMe).toBeVisible();
    await expect(login.rememberMeRow).toContainText('Remember me');
  });

  test('TC-LGN-12: Remember me checkbox is unchecked by default', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.rememberMe).not.toBeChecked();
  });

  test('TC-LGN-13: Clicking the row toggles the Remember me checkbox via its <label>', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.rememberMeRow.click();
    await expect(login.rememberMe).toBeChecked();
    await login.rememberMeRow.click();
    await expect(login.rememberMe).not.toBeChecked();
  });

  test('TC-LGN-14: Login WITHOUT Remember me stores token in sessionStorage only', async ({
    page,
    request,
  }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);
    const home = new HomePage(page);

    await login.goto();
    await login.fillAndSubmit({ email: u.email, password: u.password, rememberMe: false });
    await page.waitForURL((url) => url.pathname === '/');
    await expect(home.heading).toBeVisible();

    const s = await readTokenStorage(page);
    expect(s.session).toBeTruthy();
    expect(s.local).toBeNull();
    expect(s.sessionUser).toContain(u.username);
    expect(s.localUser).toBeNull();
  });

  test('TC-LGN-15: Login WITH Remember me stores token in localStorage only', async ({
    page,
    request,
  }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);
    const home = new HomePage(page);

    await login.goto();
    await login.fillAndSubmit({ email: u.email, password: u.password, rememberMe: true });
    await page.waitForURL((url) => url.pathname === '/');
    await expect(home.heading).toBeVisible();

    const s = await readTokenStorage(page);
    expect(s.local).toBeTruthy();
    expect(s.session).toBeNull();
    expect(s.localUser).toContain(u.username);
    expect(s.sessionUser).toBeNull();
  });

  test('TC-LGN-16: A subsequent Remember-me login overwrites a prior session login', async ({
    page,
    request,
  }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);
    const nav = new NavBar(page);

    await login.goto();
    await login.fillAndSubmit({ email: u.email, password: u.password, rememberMe: false });
    await page.waitForURL((url) => url.pathname === '/');
    let s = await readTokenStorage(page);
    expect(s.session).toBeTruthy();
    expect(s.local).toBeNull();

    await nav.logoutBtn.click();
    await expect(nav.loginLink).toBeVisible();
    await login.goto();
    await login.fillAndSubmit({ email: u.email, password: u.password, rememberMe: true });
    await page.waitForURL((url) => url.pathname === '/');

    s = await readTokenStorage(page);
    expect(s.local).toBeTruthy();
    expect(s.session).toBeNull();
  });

  test('TC-LGN-17: Logout clears the token from both storage tiers', async ({
    page,
    request,
  }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);
    const nav = new NavBar(page);

    await login.goto();
    await login.fillAndSubmit({ email: u.email, password: u.password, rememberMe: true });
    await page.waitForURL((url) => url.pathname === '/');

    await nav.logoutBtn.click();
    await expect(nav.loginLink).toBeVisible();

    const s = await readTokenStorage(page);
    expect(s.local).toBeNull();
    expect(s.session).toBeNull();
    expect(s.localUser).toBeNull();
    expect(s.sessionUser).toBeNull();
  });

  test('TC-LGN-18: Backend issues a 1-day JWT when rememberMe=false', async ({ request }) => {
    const u = users.primary();
    await apiSignup(request, u);

    const res = await request.post('/api/auth/login', {
      data: { email: u.email, password: u.password, rememberMe: false },
    });
    expect(res.ok()).toBeTruthy();
    const { token } = await res.json();
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - decoded.iat;

    expect(ttl).toBeGreaterThanOrEqual(ONE_DAY_S - 5);
    expect(ttl).toBeLessThanOrEqual(ONE_DAY_S + 5);
  });

  test('TC-LGN-19: Backend issues a 30-day JWT when rememberMe=true', async ({ request }) => {
    const u = users.primary();
    await apiSignup(request, u);

    const res = await request.post('/api/auth/login', {
      data: { email: u.email, password: u.password, rememberMe: true },
    });
    expect(res.ok()).toBeTruthy();
    const { token } = await res.json();
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - decoded.iat;

    expect(ttl).toBeGreaterThanOrEqual(THIRTY_DAYS_S - 5);
    expect(ttl).toBeLessThanOrEqual(THIRTY_DAYS_S + 5);
  });

  test('TC-LGN-20: Omitting rememberMe defaults to the short (1-day) JWT', async ({ request }) => {
    const u = users.primary();
    await apiSignup(request, u);

    const res = await request.post('/api/auth/login', {
      data: { email: u.email, password: u.password },
    });
    expect(res.ok()).toBeTruthy();
    const { token } = await res.json();
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - decoded.iat;

    expect(ttl).toBeGreaterThanOrEqual(ONE_DAY_S - 5);
    expect(ttl).toBeLessThanOrEqual(ONE_DAY_S + 5);
  });

  test('TC-LGN-21: Truthy non-boolean rememberMe is coerced to long TTL', async ({ request }) => {
    const u = users.primary();
    await apiSignup(request, u);

    const res = await request.post('/api/auth/login', {
      data: { email: u.email, password: u.password, rememberMe: 'yes' },
    });
    expect(res.ok()).toBeTruthy();
    const { token } = await res.json();
    const ttl = jwt.decode(token).exp - jwt.decode(token).iat;
    expect(ttl).toBeGreaterThanOrEqual(THIRTY_DAYS_S - 5);
  });

  test('TC-LGN-22: Wrong password with Remember me ticked still rejects login', async ({
    page,
    request,
  }) => {
    const u = users.primary();
    await apiSignup(request, u);
    const login = new LoginPage(page);

    await login.goto();
    await login.fillAndSubmit({
      email: u.email,
      password: 'WrongPass1',
      rememberMe: true,
    });

    await expect(login.error).toContainText(/Invalid email or password/i);
    expect(new URL(page.url()).pathname).toBe('/login.html');

    const s = await readTokenStorage(page);
    expect(s.local).toBeNull();
    expect(s.session).toBeNull();
  });
});
