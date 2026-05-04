const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REMEMBER_ME_EXPIRES_IN } = require('../config');

const router = express.Router();

function signToken(user, rememberMe = false) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: rememberMe ? JWT_REMEMBER_ME_EXPIRES_IN : JWT_EXPIRES_IN }
  );
}

router.post('/signup', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?')
    .get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Username or email already in use' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  ).run(username, email, hash);

  const user = { id: Number(info.lastInsertRowid), username, email };
  const token = signToken(user);
  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password, rememberMe } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = { id: row.id, username: row.username, email: row.email };
  const token = signToken(user, Boolean(rememberMe));
  res.json({ token, user });
});

module.exports = router;
