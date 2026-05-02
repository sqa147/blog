// Auth helpers: sign up / log in via the API, inject a session into a page,
// clear the session, and craft a tampered session for negative tests.

async function apiSignup(request, user) {
  const res = await request.post('/api/auth/signup', { data: user });
  if (!res.ok()) {
    throw new Error(`apiSignup failed: ${res.status()} ${await res.text()}`);
  }
  return res.json(); // { token, user }
}

async function apiLogin(request, { email, password }) {
  const res = await request.post('/api/auth/login', { data: { email, password } });
  if (!res.ok()) {
    throw new Error(`apiLogin failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

async function setSession(page, token, user) {
  // Use sessionStorage as a one-shot guard so the init script writes the
  // session on the first page load and stays out of the way after a
  // legitimate logout / Auth.clear() inside the app.
  await page.addInitScript(({ t, u }) => {
    try {
      if (window.sessionStorage.getItem('__qaSessionInjected')) return;
      window.sessionStorage.setItem('__qaSessionInjected', '1');
      window.localStorage.setItem('token', t);
      window.localStorage.setItem('user', JSON.stringify(u));
    } catch (_) { /* ignore */ }
  }, { t: token, u: user });
}

async function clearSession(page) {
  await page.addInitScript(() => {
    try {
      if (window.sessionStorage.getItem('__qaSessionCleared')) return;
      window.sessionStorage.setItem('__qaSessionCleared', '1');
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    } catch (_) { /* ignore */ }
  });
}

async function setTamperedSession(page, username = 'ali.khan') {
  const tampered = 'aaa.bbb.ccc';
  await setSession(page, tampered, {
    id: 1,
    username,
    email: `${username}@miniblog.test`,
  });
  return tampered;
}

async function ensureSignedIn(page, request, user) {
  const data = await apiSignup(request, user);
  await setSession(page, data.token, data.user);
  return data; // { token, user }
}

module.exports = {
  apiSignup,
  apiLogin,
  setSession,
  clearSession,
  setTamperedSession,
  ensureSignedIn,
};
