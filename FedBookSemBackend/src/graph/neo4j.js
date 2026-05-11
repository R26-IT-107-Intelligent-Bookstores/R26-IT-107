require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'fedbooksem123'
  )
);

async function read(query, params = {}) {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
}

async function write(query, params = {}) {
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const result = await session.run(query, params);
    return result.records;
  } finally {
    await session.close();
  }
}

async function getPrivateKey(actorId) {
  const records = await read(
    'MATCH (p:Person {id: $id}) RETURN p.privateKey AS privateKey',
    { id: actorId }
  );
  if (!records.length) return null;
  return records[0].get('privateKey');
}

module.exports = { driver, read, write, getPrivateKey };
