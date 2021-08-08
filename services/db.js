// Do not change this file
const { MongoClient } = require('mongodb');

const URI = process.env.DB_URI || process.env.MONGO_URI; // Declare MONGO_URI in your .env file
const DB_NAME = process.env.NODE_ENV == 'test' ? process.env.TEST_DB_NAME : process.env.DB_NAME;

if (!URI) {
  throw new Error(
    'Please define the MONGO_URI/DB environment variable inside .env'
  )
}
if (!DB_NAME) {
  throw new Error(
     'Please define the DB_NAME environment variable inside .env'
  )
}

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = {conn: null,promise: null}
}

async function connectToDb() {
  if (cached.conn){
    return cached.conn;
  }
  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
    cached.promise = MongoClient.connect(URI,opts).then((client)=> {
      return {
        client,
        db: client.db(DB_NAME)
      }
    }) 
  }
  cached.conn = await cached.promise
  return cached.conn
}
async function cleanupTestDb(){
  const {db} = await connectToDb();
  await db.collection('IS-stocks').deleteMany({});
  await db.collection('IS-stocklikes').deleteMany({});
}

module.exports = {connectToDb,cleanupTestDb};