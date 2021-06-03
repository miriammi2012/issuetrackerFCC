require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main(cb) {
  const URI = process.env.MONGO_URI;
  const client = new MongoClient(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    // connect to Mongodb cluster
    await client.connect();

    //Make the app
    await cb(client);
  } catch (err) {
    console.error(err);
    throw new Error("Unable to Connect to Database");
  }
}
module.exports = main;
