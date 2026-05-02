// Post helpers: shortcut create / list / delete via the API for fast setup.

async function apiCreatePost(request, token, { title, content }) {
  const res = await request.post('/api/posts', {
    headers: { Authorization: `Bearer ${token}` },
    data: { title, content },
  });
  if (!res.ok()) {
    throw new Error(`apiCreatePost failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

async function apiListPosts(request) {
  const res = await request.get('/api/posts');
  if (!res.ok()) {
    throw new Error(`apiListPosts failed: ${res.status()}`);
  }
  return res.json();
}

async function apiDeletePost(request, token, id) {
  return request.delete(`/api/posts/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

module.exports = { apiCreatePost, apiListPosts, apiDeletePost };
