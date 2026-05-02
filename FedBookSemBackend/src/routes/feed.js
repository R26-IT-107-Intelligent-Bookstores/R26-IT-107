const express = require('express');
const jwt = require('jsonwebtoken');
const { getTimeline, getAllReviews, recommendBooks, booksLikedByFollowed } = require('../graph/social');

const router = express.Router();

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

router.get('/', auth, async (req, res) => {
  res.json(await getTimeline(req.user.id));
});

router.get('/all', async (_req, res) => {
  res.json(await getAllReviews());
});

router.get('/recommendations', auth, async (req, res) => {
  res.json(await recommendBooks(req.user.id));
});

router.get('/liked-by-followed', auth, async (req, res) => {
  res.json(await booksLikedByFollowed(req.user.id));
});

module.exports = router;
