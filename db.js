require("dotenv").config();
const { MongoClient } = require("mongodb");

const connect = (dbName) => {
  const URI = process.env.MONGO_URI;
  return new Promise((resolve, reject) => {
    let savedConn = null;
    MongoClient.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
      .then((conn) => {
        savedConn = conn;
        let db = conn.db(dbName);
        resolve({ db, savedConn });
      })
      .catch((err) => reject(err));
  });
};
const connectToDb = async (cb, errHandler) => {
  const { dbName } = require("./constants");
  let conn = null;
  try {
    const { db, savedConn } = await connect(dbName);
    conn = savedConn;
    await cb(db);
  } catch (err) {
    console.error(err);
    errHandler(err);
  } finally {
    await conn.close();
  }
};
module.exports = { connectToDb, connect };
