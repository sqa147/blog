const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const rows = db.prepare(`
    SELECT c.id, c.content, c.created_at,
           u.id AS author_id, u.username AS author_username
    FROM comments c
    JOIN users u ON u.id = c.author_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.postId);
  res.json(rows);
});

router.post('/', authRequired, (req, res) => {
  const { content } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'content is required' });
  }
  if (content.length > 2000) {
    return res.status(400).json({ error: 'comment too long (max 2000 chars)' });
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const info = db.prepare(
    'INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)'
  ).run(req.params.postId, req.user.id, content.trim());

  const comment = db.prepare(`
    SELECT c.id, c.content, c.created_at,
           u.id AS author_id, u.username AS author_username
    FROM comments c
    JOIN users u ON u.id = c.author_id
    WHERE c.id = ?
  `).get(Number(info.lastInsertRowid));
  res.status(201).json(comment);
});

router.delete('/:commentId', authRequired, (req, res) => {
  const row = db.prepare(
    'SELECT author_id FROM comments WHERE id = ? AND post_id = ?'
  ).get(req.params.commentId, req.params.postId);
  if (!row) return res.status(404).json({ error: 'Comment not found' });
  if (row.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own comments' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.commentId);
  res.json({ ok: true });
});

module.exports = router;
