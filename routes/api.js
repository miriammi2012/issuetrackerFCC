"use strict";

const { ObjectID } = require("mongodb");
const { isNaN, toBool } = require("../utils");
const { connectToDb } = require("../db");

module.exports = function (app) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      let queryData = req.query;
      !isNaN(queryData.open) &&
        (queryData.open = queryData.open == "true" ? true : false);
      await connectToDb(async (db) => {
        const data = await db
          .find({ project, ...queryData })
          .sort({ created_on: 1 })
          .toArray();
        res.json(data);
      }).catch((error) => {
        res.status(500).json(error);
      });
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
      await connectToDb(async (db) => {
        const doc = await db.insertOne(data);
        res.json(doc.ops[0]);
      }).catch((error) => {
        res.status(500).json(error);
      });
    })

    .put(async function (req, res) {
      // let project = req.params.project;

      const { _id, open, ...otherUpdates } = req.body;
      const isOpen = !isNaN(open) ? { open: toBool(open) } : {};
      await connectToDb(async (db) => {
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
      }).catch((error) => {
        res.status(500).json(error);
      });
    })

    .delete(async function (req, res) {
      // let project = req.params.project;
      const { _id } = req.body;
      await connectToDb(async (db) => {
        const doc = await db.findOneAndDelete({
          _id: ObjectID(_id),
        });
        res.json(doc.value);
      }).catch((error) => {
        res.status(500).json(error);
      });
    });
};
