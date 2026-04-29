const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { read, write, getPrivateKey } = require('../graph/neo4j');
const { deliverActivity } = require('../activitypub/delivery');
const jwt = require('jsonwebtoken');

const router = express.Router();
const BASE_URL = () => process.env.BASE_URL || 'http://localhost:3001';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /annotations
router.post('/', auth, async (req, res) => {
  const { bookSource, exactText, prefix, suffix, startOffset, endOffset, motivation, bodyValue } = req.body;
  if (!bookSource || !exactText) return res.status(400).json({ error: 'bookSource and exactText required' });

  const id = uuidv4();
  const actorId = req.user.id;
  const base = BASE_URL();

  // Extract ISBN from bookSource URL
  const isbnMatch = bookSource.match(/\/books\/([^/]+)$/);
  const isbn = isbnMatch ? isbnMatch[1] : null;

  await write(
    `MATCH (p:Person {id: $actorId})
     ${isbn ? 'OPTIONAL MATCH (b:Book {isbn: $isbn})' : ''}
     CREATE (an:Annotation {
       id: $id,
       motivation: $motivation,
       bodyValue: $bodyValue,
       exactText: $exactText,
       prefix: $prefix,
       suffix: $suffix,
       startOffset: $startOffset,
       endOffset: $endOffset,
       bookSource: $bookSource,
       created: datetime()
     })
     CREATE (p)-[:ANNOTATED]->(an)
     ${isbn ? 'FOREACH (book IN CASE WHEN b IS NOT NULL THEN [b] ELSE [] END | CREATE (an)-[:ON_SOURCE]->(book))' : ''}`,
    { actorId, isbn, id, motivation: motivation || 'commenting', bodyValue: bodyValue || '', exactText, prefix: prefix || '', suffix: suffix || '', startOffset: startOffset || 0, endOffset: endOffset || 0, bookSource }
  );

  const annotation = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: `${base}/annotations/${id}`,
    type: 'Annotation',
    motivation: motivation || 'commenting',
    creator: actorId,
    created: new Date().toISOString(),
    target: {
      source: bookSource,
      selector: [
        { type: 'TextQuoteSelector', exact: exactText, prefix: prefix || '', suffix: suffix || '' },
        { type: 'TextPositionSelector', start: startOffset || 0, end: endOffset || 0 },
      ],
    },
    body: { type: 'TextualBody', value: bodyValue || '', format: 'text/plain' },
  };

  const privateKey = await getPrivateKey(actorId);
  if (privateKey) {
    const followers = await read(
      `MATCH (f:Person)-[:FOLLOWS]->(:Person {id: $actorId})
       WHERE f.domain <> $domain RETURN f.id AS id`,
      { actorId, domain: process.env.DOMAIN }
    );
    const inboxUrls = followers.map((r) => `${r.get('id')}/inbox`);
    if (inboxUrls.length) {
      const activity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Create',
        actor: actorId,
        object: annotation,
      };
      deliverActivity(activity, { id: actorId }, inboxUrls, privateKey);
    }
  }

  res.status(201).json({ id, ...annotation });
});

// GET /annotations?bookSource=...&exact=...
router.get('/', async (req, res) => {
  const { bookSource, exact } = req.query;
  if (!bookSource) return res.status(400).json({ error: 'bookSource required' });

  let query = `MATCH (p:Person)-[:ANNOTATED]->(an:Annotation {bookSource: $bookSource})`;
  const params = { bookSource };

  if (exact) {
    query += ` WHERE an.exactText = $exact`;
    params.exact = exact;
  }

  query += ` RETURN an, p.username AS username, p.displayName AS displayName, p.avatarUrl AS avatarUrl ORDER BY an.created DESC`;

  const records = await read(query, params);
  res.json(records.map((r) => ({
    ...r.get('an').properties,
    author: {
      username: r.get('username'),
      displayName: r.get('displayName'),
      avatarUrl: r.get('avatarUrl'),
    },
  })));
});

// GET /annotations/:id/thread
router.get('/:id/thread', async (req, res) => {
  const records = await read(
    `MATCH (p:Person)-[:REPLIED]->(reply:Reply)-[:REPLY_TO]->(an:Annotation {id: $id})
     RETURN reply.id AS id, reply.content AS content, reply.published AS published,
            p.username AS username, p.displayName AS displayName, p.avatarUrl AS avatarUrl
     ORDER BY reply.published ASC`,
    { id: req.params.id }
  );
  res.json(records.map((r) => ({
    id: r.get('id'),
    content: r.get('content'),
    published: r.get('published'),
    author: {
      username: r.get('username'),
      displayName: r.get('displayName'),
      avatarUrl: r.get('avatarUrl'),
    },
  })));
});

// DELETE /annotations/:id
router.delete('/:id', auth, async (req, res) => {
  await write(
    `MATCH (p:Person {id: $actorId})-[:ANNOTATED]->(an:Annotation {id: $id})
     DETACH DELETE an`,
    { actorId: req.user.id, id: req.params.id }
  );
  res.json({ deleted: true });
});

module.exports = router;
