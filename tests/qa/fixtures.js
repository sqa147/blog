// Custom fixtures to remove repetition across specs.
//
// `signedIn` — provides a fresh registered user already injected into the
// page session. Use it when the test starts as an authenticated user.
const base = require('@playwright/test');
const { users } = require('./data/testData');
const { apiSignup, setSession } = require('./helpers/auth');

const test = base.test.extend({
  signedIn: async ({ page, request }, use) => {
    const data = users.primary();
    const { token, user } = await apiSignup(request, data);
    await setSession(page, token, user);
    await use({ page, request, user, token, password: data.password });
  },
});

module.exports = { test, expect: base.expect };
