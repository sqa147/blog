const Auth = {
  get token() { return localStorage.getItem('token'); },
  get user() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  set(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isLoggedIn() { return !!this.token; },
};

async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && Auth.token) headers.Authorization = `Bearer ${Auth.token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function renderNav() {
  const el = document.getElementById('nav-links');
  if (!el) return;

  if (Auth.isLoggedIn()) {
    const username = Auth.user ? Auth.user.username : '';
    el.innerHTML = `
      <a href="/create.html">New Post</a>
      <span class="muted-link">Hi, ${escapeHtml(username)}</span>
      <button id="logout-btn">Logout</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', () => {
      Auth.clear();
      window.location.href = '/';
    });
  } else {
    el.innerHTML = `
      <a href="/login.html">Login</a>
      <a href="/signup.html">Sign up</a>
    `;
  }
}

function showError(msg) {
  const el = document.getElementById('error');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function clearError() {
  const el = document.getElementById('error');
  if (!el) return;
  el.textContent = '';
  el.classList.remove('show');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(iso) {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleString();
}

document.addEventListener('DOMContentLoaded', renderNav);
