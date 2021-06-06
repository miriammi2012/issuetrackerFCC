"use strict";

const { ObjectID } = require("mongodb");
const { isNaN, toBool } = require("../utils");
const dbConnect = require("../db");

const dbName =
  process.env.NODE_ENV == "test" ? "myFirstDBTests" : "myFirstDatabase";
const collectionName = "QA-issues";
module.exports = function (app, myDataBase) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      let queryData = req.query;
      !isNaN(queryData.open) &&
        (queryData.open = queryData.open == "true" ? true : false);
      let conn = null;
      try {
        const { db, savedConn } = await dbConnect(dbName, collectionName);
        conn = savedConn;
        const data = await db
          .find({ project, ...queryData })
          .sort({ created_on: 1 })
          .toArray();
        res.json(data);
      } catch (error) {
        res.status(500).json(error);
      } finally {
        await conn.close();
      }
    })

    .post(async function (req, res) {
      let project = req.params.project;
      const data = req.body;
      if (!data.issue_text || !data.issue_title || !data.created_by) {
        res.status(500).send("Required fields should not be empty");
        return;
      }
      isNaN(data.open) && (data.open = true);
      data.created_on = new Date();
      data.updated_on = new Date();
      data.project = project;
      let conn = null;
      try {
        const { db, savedConn } = await dbConnect(dbName, collectionName);
        conn = savedConn;
        const doc = await db.insertOne(data);
        res.json(doc.ops[0]);
      } catch (error) {
        res.status(500).json(error);
      } finally {
        await conn.close();
      }
    })

    .put(async function (req, res) {
      // let project = req.params.project;

      const { _id, open, ...otherUpdates } = req.body;
      const isOpen = !isNaN(open) ? { open: toBool(open) } : {};
      let conn = null;
      try {
        const { db, savedConn } = await dbConnect(dbName, collectionName);
        conn = savedConn;
        const doc = await db.findOneAndUpdate(
          {
            _id: ObjectID(_id),
          },
          {
            $set: {
              ...otherUpdates,
              ...isOpen,
            },
          },
          {
            returnDocument: "after",
          }
        );
        res.json(doc.value);
      } catch (error) {
        res.status(500).json(error);
      } finally {
        await conn.close();
      }
    })

    .delete(async function (req, res) {
      // let project = req.params.project;
      const { _id } = req.body;
      let conn = null;
      try {
        const { db, savedConn } = await dbConnect(dbName, collectionName);
        conn = savedConn;
        const doc = await db.findOneAndDelete({
          _id: ObjectID(_id),
        });
        res.json(doc.value);
      } catch (error) {
        res.status(500).json(error);
      } finally {
        await conn.close();
      }
    });
};
