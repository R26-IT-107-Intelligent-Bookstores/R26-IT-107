const express = require('express');
const { read } = require('../graph/neo4j');

const router = express.Router();
const BASE_URL = () => process.env.BASE_URL || 'http://localhost:3001';

function buildPersonActor(p) {
  const base = BASE_URL();
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
    ],
    id: `${base}/users/${p.username}`,
    type: 'Person',
    preferredUsername: p.username,
    name: p.displayName,
    summary: p.bio || '',
    inbox: `${base}/users/${p.username}/inbox`,
    outbox: `${base}/users/${p.username}/outbox`,
    followers: `${base}/users/${p.username}/followers`,
    following: `${base}/users/${p.username}/following`,
    icon: p.avatarUrl ? { type: 'Image', url: p.avatarUrl } : undefined,
    publicKey: {
      id: `${base}/users/${p.username}#main-key`,
      owner: `${base}/users/${p.username}`,
      publicKeyPem: p.publicKey,
    },
  };
}

function buildBookActor(b) {
  const base = BASE_URL();
  return {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${base}/books/${b.isbn}`,
    type: 'Group',
    name: b.title,
    summary: `Book by ${b.author} (${b.year})`,
    inbox: `${base}/inbox`,
    outbox: `${base}/books/${b.isbn}/outbox`,
    followers: `${base}/books/${b.isbn}/followers`,
  };
}

// Person actor
router.get('/users/:username', async (req, res) => {
  const records = await read(
    'MATCH (p:Person {username: $username}) RETURN p',
    { username: req.params.username }
  );
  if (!records.length) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Content-Type', 'application/activity+json');
  res.json(buildPersonActor(records[0].get('p').properties));
});

router.get('/users/:username/followers', async (req, res) => {
  const records = await read(
    `MATCH (f:Person)-[:FOLLOWS]->(p:Person {username: $username})
     RETURN f.id AS id`,
    { username: req.params.username }
  );
  const base = BASE_URL();
  res.setHeader('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${base}/users/${req.params.username}/followers`,
    type: 'OrderedCollection',
    totalItems: records.length,
    orderedItems: records.map((r) => r.get('id')),
  });
});

router.get('/users/:username/following', async (req, res) => {
  const records = await read(
    `MATCH (p:Person {username: $username})-[:FOLLOWS]->(f:Person)
     RETURN f.id AS id`,
    { username: req.params.username }
  );
  const base = BASE_URL();
  res.setHeader('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${base}/users/${req.params.username}/following`,
    type: 'OrderedCollection',
    totalItems: records.length,
    orderedItems: records.map((r) => r.get('id')),
  });
});

router.get('/users/:username/outbox', async (req, res) => {
  const records = await read(
    `MATCH (p:Person {username: $username})-[:AUTHORED]->(r:Review)
     RETURN r.activityId AS id, r.content AS content, r.published AS published`,
    { username: req.params.username }
  );
  const base = BASE_URL();
  res.setHeader('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${base}/users/${req.params.username}/outbox`,
    type: 'OrderedCollection',
    totalItems: records.length,
    orderedItems: records.map((r) => ({
      type: 'Create',
      id: r.get('id'),
      object: { type: 'Note', content: r.get('content') },
    })),
  });
});

// Book actor
router.get('/books/:isbn', async (req, res) => {
  const records = await read(
    'MATCH (b:Book {isbn: $isbn}) RETURN b',
    { isbn: req.params.isbn }
  );
  if (!records.length) return res.status(404).json({ error: 'Not found' });
  res.setHeader('Content-Type', 'application/activity+json');
  res.json(buildBookActor(records[0].get('b').properties));
});

router.get('/books/:isbn/followers', async (req, res) => {
  const base = BASE_URL();
  res.setHeader('Content-Type', 'application/activity+json');
  res.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${base}/books/${req.params.isbn}/followers`,
    type: 'OrderedCollection',
    totalItems: 0,
    orderedItems: [],
  });
});

module.exports = router;
