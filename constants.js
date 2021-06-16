module.exports = {
  dbName: process.env.NODE_ENV == "test" ? "myFirstDBTests" : "myFirstDatabase",
};
