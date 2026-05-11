require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers — allow cross-origin images for avatars
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors());
app.use(morgan('dev'));

// JSON body parser — accept ActivityPub content types
app.use(express.json({
  type: [
    'application/json',
    'application/activity+json',
    'application/ld+json',
  ],
}));

// Static file serving for avatars
app.use('/avatars', express.static(path.join(__dirname, '../public/avatars')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fedbooksem-backend' });
});

// Routes
const authRoutes = require('./routes/auth');
const actorRoutes = require('./routes/actors');
const webfingerRoutes = require('./routes/webfinger');
const inboxRoutes = require('./routes/inbox');
const reviewRoutes = require('./routes/reviews');
const annotationRoutes = require('./routes/annotations');
const bookRoutes = require('./routes/books');
const socialRoutes = require('./routes/social');
const feedRoutes = require('./routes/feed');
const userRoutes = require('./routes/users');
const coverRoutes = require('./routes/covers');

app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/covers', coverRoutes);

// ActivityPub routes at root (spec requirement)
app.use('/.well-known', webfingerRoutes);
app.use('/inbox', inboxRoutes);
app.use('/', actorRoutes);

app.listen(PORT, () => {
  console.log(`FedBook-Sem backend running on port ${PORT}`);
});

module.exports = app;
