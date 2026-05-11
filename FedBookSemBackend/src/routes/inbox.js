const express = require('express');
const { write } = require('../graph/neo4j');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/', async (req, res) => {
  const activity = req.body;
  if (!activity || !activity.type) return res.status(400).json({ error: 'invalid activity' });

  try {
    switch (activity.type) {
      case 'Follow': {
        await write(
          `MERGE (a:Person {id: $followerId})
           MERGE (b:Person {id: $followeeId})
           MERGE (a)-[:FOLLOWS]->(b)`,
          { followerId: activity.actor, followeeId: activity.object }
        );
        break;
      }
      case 'Undo': {
        if (activity.object?.type === 'Follow') {
          await write(
            `MATCH (a:Person {id: $followerId})-[r:FOLLOWS]->(b:Person {id: $followeeId})
             DELETE r`,
            { followerId: activity.actor, followeeId: activity.object.object }
          );
        }
        break;
      }
      case 'Like': {
        await write(
          `MERGE (a:Person {id: $actorId})
           MERGE (r:Review {activityId: $objectId})
           MERGE (a)-[:LIKES]->(r)`,
          { actorId: activity.actor, objectId: activity.object }
        );
        break;
      }
      case 'Announce': {
        await write(
          `MERGE (a:Person {id: $actorId})
           MERGE (r:Review {activityId: $objectId})
           MERGE (a)-[:BOOSTED]->(r)`,
          { actorId: activity.actor, objectId: activity.object }
        );
        break;
      }
      case 'Create': {
        if (activity.object?.type === 'Note') {
          const id = uuidv4();
          await write(
            `MERGE (a:Person {id: $actorId})
             CREATE (reply:Reply {
               id: $id,
               content: $content,
               published: datetime(),
               inReplyTo: $inReplyTo
             })
             CREATE (a)-[:REPLIED]->(reply)`,
            {
              actorId: activity.actor,
              id,
              content: activity.object.content || '',
              inReplyTo: activity.object.inReplyTo || '',
            }
          );
        }
        break;
      }
    }
  } catch (err) {
    console.error('Inbox error:', err.message);
  }

  res.status(202).json({ status: 'accepted' });
});

module.exports = router;
