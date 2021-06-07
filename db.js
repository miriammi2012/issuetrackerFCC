require("dotenv").config();
const { MongoClient } = require("mongodb");

const connect = (dbName, collectionName) => {
  const URI = process.env.MONGO_URI;
  return new Promise((resolve, reject) => {
    let savedConn = null;
    MongoClient.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
      .then((conn) => {
        savedConn = conn;
        return conn.db(dbName).collection(collectionName);
      })
      .then((db) => {
        resolve({ db, savedConn });
      })
      .catch((err) => reject(err));
  });
};
const connectToDb = async (cb, errHandler) => {
  const { dbName, collectionName } = require("./constants");
  let conn = null;
  try {
    const { db, savedConn } = await connect(dbName, collectionName);
    conn = savedConn;
    await cb(db);
  } catch (err) {
    errHandler(err);
  } finally {
    await conn.close();
  }
};
module.exports = { connectToDb, connect };
