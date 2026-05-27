const fs = require('fs');
const path = require('path');

const dbP = path.join(__dirname, '../database/users.json');
const useMongo = Boolean(process.env.MONGODB_URI);
let mongoClient;
let usersCollection;

function ensureJsonDb() {
  if (!fs.existsSync(path.dirname(dbP))) fs.mkdirSync(path.dirname(dbP), { recursive: true });
  if (!fs.existsSync(dbP)) fs.writeFileSync(dbP, JSON.stringify([], null, 2));
}

function loadUsersJson() {
  ensureJsonDb();
  try { return JSON.parse(fs.readFileSync(dbP, 'utf8')) || []; } catch { return []; }
}

function saveUsersJson(users) {
  ensureJsonDb();
  fs.writeFileSync(dbP, JSON.stringify(users, null, 2));
}

async function connectMongo() {
  if (!useMongo || usersCollection) return usersCollection;
  let MongoClient;
  try {
    ({ MongoClient } = require('mongodb'));
  } catch {
    console.warn('[DB] MONGODB_URI terdeteksi, tapi package "mongodb" belum tersedia. Fallback ke JSON.');
    return null;
  }

  mongoClient = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 10 });
  await mongoClient.connect();
  const dbName = process.env.MONGODB_DB || 'youzapi';
  usersCollection = mongoClient.db(dbName).collection('users');
  await usersCollection.createIndex({ username: 1 }, { unique: true });
  await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
  await usersCollection.createIndex({ key: 1 }, { unique: true, sparse: true });
  return usersCollection;
}

async function getUsers() {
  const col = await connectMongo();
  if (!col) return loadUsersJson();
  return col.find({}, { projection: { _id: 0 } }).toArray();
}

async function saveUsers(users) {
  const col = await connectMongo();
  if (!col) return saveUsersJson(users);

  const ids = users.map((u) => u.id);
  if (ids.length) {
    await col.deleteMany({ id: { $nin: ids } });
    await col.bulkWrite(
      users.map((u) => ({
        updateOne: {
          filter: { id: u.id },
          update: { $set: u },
          upsert: true
        }
      })),
      { ordered: false }
    );
  } else {
    await col.deleteMany({});
  }
}

module.exports = { getUsers, saveUsers, connectMongo };
