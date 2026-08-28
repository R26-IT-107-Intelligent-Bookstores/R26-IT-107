const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { read, write } = require('../graph/neo4j');

const router = express.Router();

const DOMAIN = () => process.env.DOMAIN || 'localhost:3001';
const BASE_URL = () => process.env.BASE_URL || 'http://localhost:3001';
const USERNAME_RE = /^[a-z0-9_]{3,30}$/i;

function signActor(actor) {
  return jwt.sign(actor, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/login', async (req, res) => {
  const rawUsername = req.body.username;
  const password = req.body.password;
  if (!rawUsername || !password) return res.status(400).json({ error: 'username and password required' });

  // Register lowercases the username on write, so login must lowercase on
  // read too — otherwise "MixedCase" (typed here) never matches "mixedcase"
  // (stored) and every mixed-case account fails to log in.
  const username = String(rawUsername).trim().toLowerCase();

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

  const token = signActor(actor);
  res.json({ token, actor });
});

// POST /api/auth/register — creates a new local user and returns a JWT.
// Body: { username, password, displayName?, bio? }
// Constraints: username 3-30 chars [a-z0-9_], password >= 6 chars.
// Uniqueness is enforced by the CONSTRAINT on :Person(username) — a duplicate
// throws a Neo.ClientError.Schema.ConstraintValidationFailed which we catch
// and turn into a 409.
router.post('/register', async (req, res) => {
  const username = (req.body.username || '').trim().toLowerCase();
  const password = req.body.password || '';
  const displayName = (req.body.displayName || '').trim() || username;
  const bio = (req.body.bio || '').trim() || '';

  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Username must be 3-30 characters (letters, digits, underscore).' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const id = `${BASE_URL()}/users/${username}`;
    const domain = DOMAIN();

    await write(
      `CREATE (p:Person {
        id: $id,
        username: $username,
        displayName: $displayName,
        bio: $bio,
        domain: $domain,
        passwordHash: $passwordHash,
        avatarUrl: null,
        createdAt: datetime()
      })`,
      { id, username, displayName, bio, domain, passwordHash }
    );

    const actor = { id, username, displayName, bio, domain, avatarUrl: null };
    const token = signActor(actor);
    res.status(201).json({ token, actor });
  } catch (err) {
    if (err.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    console.error('[register]', err);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

// POST /api/auth/sso — passwordless login for users coming in from a
// trusted upstream (currently: Intelligent Bookstore, which authenticates
// against phonolex-api). Body: { username, displayName? }.
//
// If the username exists in FedBook, we return a token for that :Person.
// If it doesn't, we auto-create the :Person with no passwordHash and return
// a token for the new user. Normal /login won't work for SSO-only users
// (no password to bcrypt-compare against) — they always come back via SSO.
//
// SECURITY: this endpoint TRUSTS the caller's claim about the username.
// Upstream token verification is intentionally not done here per the
// FYP SSO design decision (see docs/SETUP.md handoff notes).
router.post('/sso', async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const displayNameIn = String(req.body.displayName || '').trim();

  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Invalid username format.' });
  }

  try {
    // Find or create — MERGE keeps this one-round-trip and idempotent.
    const displayName = displayNameIn || username;
    const id = `${BASE_URL()}/users/${username}`;
    const domain = DOMAIN();

    const records = await write(
      `MERGE (p:Person {username: $username})
       ON CREATE SET
         p.id = $id,
         p.displayName = $displayName,
         p.bio = '',
         p.domain = $domain,
         p.avatarUrl = null,
         p.createdAt = datetime(),
         p.ssoOnly = true
       RETURN p`,
      { username, id, displayName, domain }
    );

    const p = records[0].get('p').properties;
    const actor = {
      id: p.id,
      username: p.username,
      displayName: p.displayName,
      bio: p.bio || '',
      domain: p.domain,
      avatarUrl: p.avatarUrl || null,
    };
    const token = signActor(actor);
    res.json({ token, actor });
  } catch (err) {
    console.error('[sso]', err);
    res.status(500).json({ error: 'SSO sign-in failed. Please try again.' });
  }
});

module.exports = router;
