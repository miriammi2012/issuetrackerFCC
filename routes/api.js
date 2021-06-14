"use strict";

const { ObjectID } = require("mongodb");
const { isNaN, toBool, isObjEmpty } = require("../utils");
const { connectToDb } = require("../db");

module.exports = function (app) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      let queryData = req.query;
      !isNaN(queryData.open) &&
        (queryData.open = queryData.open == "true" ? true : false);
      !isNaN(queryData._id) && (queryData._id = ObjectID(queryData._id));
      await connectToDb(
        async (db) => {
          const data = await db
            .find({ project, ...queryData }, { projection: { project: 0 } })
            .sort({ created_on: 1 })
            .toArray();
          res.json(data);
        },
        (error) => {
          res.status(500).json(error);
        }
      );
    })

    .post(async function (req, res) {
      let project = req.params.project;
      const data = req.body;
      if (!data.issue_text || !data.issue_title || !data.created_by) {
        res.json({ error: "required field(s) missing" });
        return;
      }
      isNaN(data.open) && (data.open = true);
      let now = new Date();
      data.created_on = now;
      data.updated_on = now;
      isNaN(data.assigned_to) && (data.assigned_to = "");
      isNaN(data.status_text) && (data.status_text = "");
      data.project = project;
      await connectToDb(
        async (db) => {
          const doc = await db.insertOne(data);
          res.json(doc.ops[0]);
        },
        (error) => {
          res.status(500).json(error);
        }
      );
    })

    .put(async function (req, res) {
      // let project = req.params.project;

      const { _id, open, ...otherUpdates } = req.body;
      if (!_id) {
        return res.json({ error: "missing _id" });
      }
      const boolFields = !isNaN(open) ? { open: toBool(open) } : {};

      if (isObjEmpty(boolFields) && isObjEmpty(otherUpdates)) {
        return res.json({ error: "no update field(s) sent", _id });
      }
      await connectToDb(
        async (db) => {
          const result = await db.updateOne(
            {
              _id: ObjectID(_id),
            },
            {
              $set: {
                ...otherUpdates,
                ...boolFields,
                updated_on: new Date(),
              },
            }
          );
          if (result.matchedCount > 0) {
            res.json({ result: "successfully updated", _id });
          } else {
            res.json({ error: "could not update", _id });
          }
        },
        (err) => {
          console.error(err);
          res.json({ error: "could not update", _id });
        }
      );
    })

    .delete(async function (req, res) {
      // let project = req.params.project;
      const { _id } = req.body;
      if (!_id) {
        return res.json({ error: "missing _id" });
      }
      await connectToDb(
        async (db) => {
          const result = await db.deleteOne({
            _id: ObjectID(_id),
          });
          if (result.deletedCount > 0) {
            return res.json({ result: "successfully deleted", _id });
          } else {
            return res.json({ error: "could not delete", _id });
          }
        },
        (err) => {
          console.error(err);
          return res.json({ error: "could not delete", _id });
        }
      );
    });
};
