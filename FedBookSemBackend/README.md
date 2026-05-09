# FedBook-Sem

**Federated Social Bookstore** — The social and semantic layer of an Intelligent Online Bookstore platform, built as part of a final-year B.Sc. (Hons) research project at SLIIT.

> Research Project R26-IT-107 · Supervised by Ms. Dinithi Pandithage · IT22922670

---

## Overview

FedBook-Sem implements a **federated social reading network** where users can write book reviews, annotate passages using the W3C Web Annotation standard, follow other readers, and interact with content across federated servers — all powered by the **ActivityPub** protocol.

Unlike centralised book platforms, any two FedBook-Sem instances can communicate with each other (and with any ActivityPub-compatible platform such as Mastodon) without a central authority.

---

## Key Features

| Feature | Technology |
|---|---|
| Federated social graph | ActivityPub (W3C) |
| Actor discovery | WebFinger (`acct:user@domain`) |
| Signed activity delivery | HTTP Signatures (RSA-2048, node-forge) |
| Scholarly annotations | W3C Web Annotation Data Model |
| Text selectors | TextQuoteSelector + TextPositionSelector |
| Graph-based recommendations | Neo4j Cypher traversal |
| Authentication | JWT (7-day) + bcrypt password hashing |
| Avatar uploads | Multer disk storage |
| Book cover generation | Self-hosted SVG renderer |

---

## Tech Stack

### Backend
- **Node.js 20** + **Express**
- **Neo4j 5** — graph database for social relationships
- **Redis 7** — caching and queue support
- **PostgreSQL 16** — relational data
- **node-forge** — RSA-2048 key pair generation and HTTP signing
- **jsonwebtoken** + **bcryptjs** — authentication
- **multer** — file uploads
- **axios** — federated activity delivery

### Frontend
- **React 18** (Create React App)
- **React Router v6**
- **Axios** — API client with JWT interceptor
- Custom dark design system (CSS variables, Playfair Display + DM Sans)

### Infrastructure
- **Docker Compose** — Neo4j, Redis, PostgreSQL
- ActivityPub-compliant actor and inbox endpoints
- WebFinger discovery at `/.well-known/webfinger`

---

## Architecture

```
┌─────────────────────────────────────┐
│           React Frontend            │
│  Feed · Books · Annotations · Auth  │
└──────────────┬──────────────────────┘
               │ /api/*  (proxy)
┌──────────────▼──────────────────────┐
│         Express Backend             │
│                                     │
│  /api/auth      JWT login           │
│  /api/reviews   CRUD + federation   │
│  /api/annotations  W3C annotations  │
│  /api/books     book catalogue      │
│  /api/social    follow graph        │
│  /api/feed      personalised feed   │
│  /api/users     profiles + avatars  │
│  /api/covers    SVG cover generator │
│                                     │
│  /users/:u      AP actor            │
│  /inbox         AP shared inbox     │
│  /.well-known/webfinger             │
└──────┬──────────────────────────────┘
       │
┌──────▼──────────────────────────────┐
│            Neo4j Graph              │
│                                     │
│  Person ──FOLLOWS──▶ Person         │
│  Person ──AUTHORED──▶ Review        │
│  Review ──REVIEWS──▶ Book           │
│  Person ──LIKES──▶ Review           │
│  Person ──ANNOTATED──▶ Annotation   │
│  Annotation ──ON_SOURCE──▶ Book     │
└─────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop

### 1. Clone and configure

```bash
git clone https://github.com/Saku1215/FedBookSem.git
cd FedBookSem
cp .env.example .env
# Edit .env with your secrets
```

### 2. Start infrastructure

```bash
docker-compose up -d
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Apply schema and seed data

```bash
npm run schema
npm run seed
```

### 5. Start backend

```bash
npm run dev
```

### 6. Start frontend (new terminal)

```bash
cd ../frontend
npm install
npm start
```

Open **http://localhost:3000** and sign in as one of the demo users.

| Username | Password |
|----------|----------|
| alice | alice123 |
| bob | bob123 |
| carol | carol123 |

---

## ActivityPub Endpoints

| Endpoint | Description |
|---|---|
| `GET /users/:username` | Person actor JSON-LD |
| `GET /users/:username/followers` | Followers collection |
| `GET /users/:username/following` | Following collection |
| `GET /users/:username/outbox` | Outbox collection |
| `POST /inbox` | Shared inbox (Follow, Like, Announce, Create) |
| `GET /.well-known/webfinger` | WebFinger discovery |
| `GET /books/:isbn` | Book as ActivityPub Group actor |

---

## W3C Web Annotation

Annotations are stored using the W3C Web Annotation Data Model with both selector types:

```json
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "type": "Annotation",
  "motivation": "commenting",
  "body": { "type": "TextualBody", "value": "..." },
  "target": {
    "source": "http://localhost:3001/books/9789556682045",
    "selector": [
      {
        "type": "TextQuoteSelector",
        "exact": "coconut palms swaying in the monsoon wind",
        "prefix": "its ",
        "suffix": ", Piyal"
      },
      {
        "type": "TextPositionSelector",
        "start": 42,
        "end": 84
      }
    ]
  }
}
```

---

## Project Structure

```
FedBookSem/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── scripts/
│   │   └── seed.js
│   ├── src/
│   │   ├── app.js
│   │   ├── activitypub/
│   │   │   └── delivery.js
│   │   ├── graph/
│   │   │   ├── neo4j.js
│   │   │   ├── schema.js
│   │   │   └── social.js
│   │   └── routes/
│   │       ├── actors.js
│   │       ├── annotations.js
│   │       ├── auth.js
│   │       ├── books.js
│   │       ├── covers.js
│   │       ├── feed.js
│   │       ├── inbox.js
│   │       ├── reviews.js
│   │       ├── social.js
│   │       ├── users.js
│   │       └── webfinger.js
│   └── public/
│       └── avatars/
└── frontend/
    └── src/
        ├── api/client.js
        ├── context/AuthContext.js
        ├── components/
        └── pages/
```

---

## License

MIT — SLIIT Final Year Research Project 2026
