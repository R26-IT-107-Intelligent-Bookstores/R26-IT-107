const express = require('express');
const jwt = require('jsonwebtoken');
const { follow, unfollow, getAllUsers, getFollowers, getFollowing } = require('../graph/social');
const { getPrivateKey } = require('../graph/neo4j');
const { deliverActivity } = require('../activitypub/delivery');

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

router.post('/follow', auth, async (req, res) => {
  const { targetId } = req.body;
  if (!targetId) return res.status(400).json({ error: 'targetId required' });

  await follow(req.user.id, targetId);

  const privateKey = await getPrivateKey(req.user.id);
  if (privateKey && !targetId.includes(process.env.DOMAIN)) {
    const activity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Follow',
      actor: req.user.id,
      object: targetId,
    };
    deliverActivity(activity, { id: req.user.id }, [`${targetId}/inbox`], privateKey);
  }

  res.json({ following: true });
});

router.post('/unfollow', auth, async (req, res) => {
  const { targetId } = req.body;
  if (!targetId) return res.status(400).json({ error: 'targetId required' });

  await unfollow(req.user.id, targetId);

  const privateKey = await getPrivateKey(req.user.id);
  if (privateKey && !targetId.includes(process.env.DOMAIN)) {
    const activity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Undo',
      actor: req.user.id,
      object: { type: 'Follow', actor: req.user.id, object: targetId },
    };
    deliverActivity(activity, { id: req.user.id }, [`${targetId}/inbox`], privateKey);
  }

  res.json({ following: false });
});

router.get('/users', async (_req, res) => {
  const users = await getAllUsers();
  res.json(users);
});

router.get('/followers', async (req, res) => {
  const { actorId } = req.query;
  if (!actorId) return res.status(400).json({ error: 'actorId required' });
  res.json(await getFollowers(actorId));
});

router.get('/following', async (req, res) => {
  const { actorId } = req.query;
  if (!actorId) return res.status(400).json({ error: 'actorId required' });
  res.json(await getFollowing(actorId));
});

module.exports = router;
