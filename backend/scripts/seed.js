require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const forge = require('node-forge');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { write } = require('../src/graph/neo4j');

const DOMAIN = process.env.DOMAIN || 'localhost:3001';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

function generateKeyPair() {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  return {
    publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
    privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
  };
}

const users = [
  { username: 'alice', displayName: 'Alice Perera', bio: 'Lover of Sinhala fiction and poetry.', password: 'alice123' },
  { username: 'bob', displayName: 'Bob Silva', bio: 'Academic reader and literary critic.', password: 'bob123' },
  { username: 'carol', displayName: 'Carol Fernando', bio: 'Educator and avid annotator.', password: 'carol123' },
];

const books = [
  { isbn: '9789556682045', title: 'Gamperaliya', author: 'Martin Wickramasinghe', year: 1944, coverUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Gamperaliya_%28novel%29.jpg' },
  { isbn: '9789556682052', title: 'Viragaya', author: 'Martin Wickramasinghe', year: 1956, coverUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3e/Viragaya_novel.jpg' },
  { isbn: '9789555232310', title: 'Madol Doova', author: 'Martin Wickramasinghe', year: 1947, coverUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5c/MadolDoova.jpg' },
  { isbn: '9789553100012', title: 'Siri Parakum', author: 'Mahagama Sekera', year: 1964, coverUrl: null },
  { isbn: '9789555360180', title: 'Nidhanaya', author: 'Karunasena Jayalath', year: 1980, coverUrl: null },
  { isbn: '9789550019015', title: 'Ahasin Polowata', author: 'Ediriweera Sarachchandra', year: 1959, coverUrl: null },
];

const passages = {
  '9789556682045': 'The village of Koggala stretched along the southern coast, its coconut palms swaying in the monsoon wind. Piyal stood at the edge of the paddy field, watching the horizon where the ocean met the sky. Life here moved slowly, shaped by the rhythms of harvest and rain, by the stories of ancestors carried in the wind.',
  '9789556682052': 'Aravinda walked the long road alone, carrying nothing but the weight of his own silence. He had chosen solitude not out of despair but out of a deep understanding that some truths can only be found when the noise of the world fades away. The mountains ahead were indifferent to his suffering, and that indifference was its own kind of comfort.',
  '9789555232310': 'The small island in the lagoon was their kingdom. Upali and his friends had built a world there, hidden from the adults who lived their complicated lives on the mainland. The water around the island was shallow and warm, and every morning the birds came to the tall trees and filled the air with sound.',
  '9789553100012': 'The king looked out from the ramparts at the armies gathered below. He had ruled with wisdom for many years, but wisdom alone could not stop what was coming. The drums of war had been beating for weeks, and now the silence before battle was heavier than all the noise that had come before it.',
  '9789555360180': 'The treasure, if it existed at all, had been hidden for three generations. The old man in the village knew part of the story, but he guarded his knowledge carefully, sharing only fragments with those who came to ask. Some secrets, he believed, were safer left buried beneath the earth.',
  '9789550019015': 'The stage was empty and the lights were low. She had rehearsed this moment a hundred times, but now that it had arrived, the words she had memorised seemed to belong to someone else. The theatre held its breath. In the darkness of the wings, she found the stillness she needed, and walked out to meet the audience.',
};

async function seed() {
  console.log('Seeding Neo4j...');

  // Clear existing data
  await write('MATCH (n) DETACH DELETE n');
  console.log('Cleared existing data.');

  // Create users
  const userRecords = [];
  for (const u of users) {
    const { publicKey, privateKey } = generateKeyPair();
    const passwordHash = await bcrypt.hash(u.password, 12);
    const id = `${BASE_URL}/users/${u.username}`;
    await write(
      `CREATE (p:Person {
        id: $id,
        username: $username,
        displayName: $displayName,
        bio: $bio,
        domain: $domain,
        publicKey: $publicKey,
        privateKey: $privateKey,
        passwordHash: $passwordHash,
        avatarUrl: null,
        createdAt: datetime()
      })`,
      { id, username: u.username, displayName: u.displayName, bio: u.bio, domain: DOMAIN, publicKey, privateKey, passwordHash }
    );
    userRecords.push({ ...u, id });
    console.log(`Created user: ${u.username}`);
  }

  // Create books
  for (const b of books) {
    const id = `${BASE_URL}/books/${b.isbn}`;
    const passage = passages[b.isbn] || '';
    await write(
      `CREATE (b:Book {
        id: $id,
        isbn: $isbn,
        title: $title,
        author: $author,
        year: $year,
        passage: $passage,
        coverUrl: $coverUrl,
        createdAt: datetime()
      })`,
      { id, isbn: b.isbn, title: b.title, author: b.author, year: b.year, passage, coverUrl: b.coverUrl || null }
    );
    console.log(`Created book: ${b.title}`);
  }

  // Create follow relationships
  const follows = [
    ['alice', 'bob'],
    ['alice', 'carol'],
    ['bob', 'carol'],
    ['carol', 'alice'],
  ];
  for (const [follower, followee] of follows) {
    await write(
      `MATCH (a:Person {username: $follower}), (b:Person {username: $followee})
       MERGE (a)-[:FOLLOWS]->(b)`,
      { follower, followee }
    );
  }
  console.log('Created follow relationships.');

  // Create sample reviews
  const reviews = [
    { author: 'alice', isbn: '9789556682045', content: 'A timeless portrait of village life in Sri Lanka. Wickramasinghe captures the soul of a changing society with beautiful prose.', rating: 5 },
    { author: 'bob', isbn: '9789556682052', content: 'Deeply philosophical. The solitude at the heart of this novel resonates with anyone who has sought meaning beyond the ordinary.', rating: 5 },
    { author: 'carol', isbn: '9789555232310', content: 'Perfect for young readers and adults alike. The island setting is magical and the friendship between the children is wonderfully drawn.', rating: 4 },
    { author: 'alice', isbn: '9789553100012', content: 'A powerful historical epic. The language is rich and the emotional weight of the story stays with you long after the last page.', rating: 5 },
    { author: 'bob', isbn: '9789555360180', content: 'An engaging mystery with a strong sense of place. The gradual unravelling of the secret keeps you reading to the end.', rating: 4 },
    { author: 'carol', isbn: '9789550019015', content: 'Sarachchandra brings theatre and life together masterfully. A landmark in Sri Lankan literature.', rating: 5 },
  ];

  for (const r of reviews) {
    const id = uuidv4();
    await write(
      `MATCH (p:Person {username: $author}), (b:Book {isbn: $isbn})
       CREATE (r:Review {
         id: $id,
         content: $content,
         rating: $rating,
         published: datetime(),
         activityId: $activityId
       })
       CREATE (p)-[:AUTHORED]->(r)
       CREATE (r)-[:REVIEWS]->(b)`,
      {
        author: r.author,
        isbn: r.isbn,
        id,
        content: r.content,
        rating: r.rating,
        activityId: `${BASE_URL}/reviews/${id}`,
      }
    );
  }
  console.log('Created reviews.');

  // Create sample annotations
  const annotations = [
    {
      author: 'alice',
      isbn: '9789556682045',
      exact: 'coconut palms swaying in the monsoon wind',
      motivation: 'commenting',
      body: 'This image perfectly captures the rhythm of coastal life in the south.',
    },
    {
      author: 'bob',
      isbn: '9789556682052',
      exact: 'some truths can only be found when the noise of the world fades away',
      motivation: 'highlighting',
      body: 'A central theme of the entire novel expressed in a single sentence.',
    },
    {
      author: 'carol',
      isbn: '9789555232310',
      exact: 'every morning the birds came to the tall trees',
      motivation: 'tagging',
      body: 'Nature imagery as metaphor for childhood freedom.',
    },
  ];

  for (const a of annotations) {
    const id = uuidv4();
    const bookSource = `${BASE_URL}/books/${a.isbn}`;
    const passage = passages[a.isbn] || '';
    const idx = passage.indexOf(a.exact);
    await write(
      `MATCH (p:Person {username: $author}), (b:Book {isbn: $isbn})
       CREATE (an:Annotation {
         id: $id,
         motivation: $motivation,
         bodyValue: $bodyValue,
         exactText: $exact,
         prefix: $prefix,
         suffix: $suffix,
         startOffset: $start,
         endOffset: $end,
         bookSource: $bookSource,
         created: datetime()
       })
       CREATE (p)-[:ANNOTATED]->(an)
       CREATE (an)-[:ON_SOURCE]->(b)`,
      {
        author: a.author,
        isbn: a.isbn,
        id,
        motivation: a.motivation,
        bodyValue: a.body,
        exact: a.exact,
        prefix: idx > 10 ? passage.slice(idx - 10, idx) : passage.slice(0, idx),
        suffix: passage.slice(idx + a.exact.length, idx + a.exact.length + 10),
        start: idx,
        end: idx + a.exact.length,
        bookSource,
      }
    );
  }
  console.log('Created annotations.');

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
