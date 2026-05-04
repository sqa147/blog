// Comment helpers: shortcut create / list / delete via the API for fast setup.

async function apiListComments(request, postId) {
  const res = await request.get(`/api/posts/${postId}/comments`);
  if (!res.ok()) {
    throw new Error(`apiListComments failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

async function apiCreateComment(request, token, postId, content) {
  const res = await request.post(`/api/posts/${postId}/comments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: { content },
  });
  if (!res.ok()) {
    throw new Error(`apiCreateComment failed: ${res.status()} ${await res.text()}`);
  }
  return res.json();
}

async function apiDeleteComment(request, token, postId, commentId) {
  return request.delete(`/api/posts/${postId}/comments/${commentId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

module.exports = { apiListComments, apiCreateComment, apiDeleteComment };
