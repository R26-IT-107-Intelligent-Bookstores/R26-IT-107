const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { read } = require('../graph/neo4j');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  const records = await read(
    'MATCH (p:Person {username: $username}) RETURN p',
    { username }
  );

  if (!records.length) return res.status(401).json({ error: 'Invalid credentials' });

  const p = records[0].get('p').properties;

  const valid = await bcrypt.compare(password, p.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const actor = {
    id: p.id,
    username: p.username,
    displayName: p.displayName,
    bio: p.bio,
    domain: p.domain,
    avatarUrl: p.avatarUrl || null,
  };

  const token = jwt.sign(actor, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, actor });
});

module.exports = router;
