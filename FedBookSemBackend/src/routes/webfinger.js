const express = require('express');
const { read } = require('../graph/neo4j');

const router = express.Router();

router.get('/webfinger', async (req, res) => {
  const resource = req.query.resource;
  if (!resource) return res.status(400).json({ error: 'resource required' });

  // acct:username@domain
  const match = resource.match(/^acct:([^@]+)@(.+)$/);
  if (!match) return res.status(400).json({ error: 'invalid resource format' });

  const username = match[1];
  const base = process.env.BASE_URL || 'http://localhost:3001';

  const records = await read(
    'MATCH (p:Person {username: $username}) RETURN p.id AS id',
    { username }
  );

  if (!records.length) return res.status(404).json({ error: 'Not found' });

  res.setHeader('Content-Type', 'application/jrd+json');
  res.json({
    subject: resource,
    links: [
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `${base}/users/${username}`,
      },
    ],
  });
});

module.exports = router;
