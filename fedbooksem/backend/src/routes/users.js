const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getUserByUsername, updateUserProfile, updateUserAvatar, getUserReviews, getFollowCounts } = require('../graph/social');

const router = express.Router();
const BASE_URL = () => process.env.BASE_URL || 'http://localhost:3001';

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/avatars'),
  filename: (req, _file, cb) => {
    const ext = path.extname(_file.originalname).toLowerCase();
    cb(null, `${req.params.username}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  },
});

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

router.get('/:username', async (req, res) => {
  const user = await getUserByUsername(req.params.username);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const counts = await getFollowCounts(user.id);
  const reviews = await getUserReviews(user.id);
  res.json({ ...user, ...counts, reviewCount: reviews.length, reviews });
});

router.put('/:username', auth, async (req, res) => {
  const { displayName, bio } = req.body;
  await updateUserProfile(req.params.username, { displayName, bio });
  const user = await getUserByUsername(req.params.username);
  res.json(user);
});

router.post('/:username/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const base = BASE_URL();
  const avatarUrl = `${base}/avatars/${req.file.filename}`;
  await updateUserAvatar(req.params.username, avatarUrl);
  res.json({ avatarUrl });
});

module.exports = router;
