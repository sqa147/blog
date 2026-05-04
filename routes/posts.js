const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.title, p.content, p.created_at,
           u.id AS author_id, u.username AS author_username
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ORDER BY p.created_at DESC
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT p.id, p.title, p.content, p.created_at,
           u.id AS author_id, u.username AS author_username
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Post not found' });
  res.json(row);
});

router.post('/', authRequired, (req, res) => {
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }
  const info = db.prepare(
    'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)'
  ).run(title.trim(), content.trim(), req.user.id);

  const post = db.prepare(`
    SELECT p.id, p.title, p.content, p.created_at,
           u.id AS author_id, u.username AS author_username
    FROM posts p
    JOIN users u ON u.id = p.author_id
    WHERE p.id = ?
  `).get(Number(info.lastInsertRowid));
  res.status(201).json(post);
});

router.delete('/:id', authRequired, (req, res) => {
  const row = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Post not found' });
  if (row.author_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete your own posts' });
  }
  // BUG (intentionally injected for QA): row is never removed.
  // db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
