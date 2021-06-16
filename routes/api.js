"use strict";

const { ObjectID, ObjectId } = require("mongodb");
const { isNaN, stringToBool, isObjEmpty } = require("../utils");
const { connectToDb } = require("../db");

module.exports = function (app) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      let queryData = req.query;
      !isNaN(queryData.open) && (queryData.open = stringToBool(queryData.open));
      !isNaN(queryData._id) && (queryData._id = ObjectID(queryData._id));
      await connectToDb(
        async (db) => {
          const projectsCollection = db.collection("projects");
          const issuesCollection = db.collection("issues");
          const projectData = await projectsCollection
            .find({ project })
            .toArray();
          const issues = await issuesCollection
            .find({
              _id: {
                $in: projectData.length != 0 ? projectData[0].issueIds : [],
              },
              ...queryData,
            })
            .toArray();
          res.json(issues);
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
      data._id = ObjectId();
      await connectToDb(
        async (db) => {
          const projectsCollection = db.collection("projects");
          const issuesCollection = db.collection("issues");
          const issueObj = await issuesCollection.insertOne(data);
          if (issueObj.insertedCount > 0) {
            const result = await projectsCollection.updateOne(
              { project },
              {
                $push: {
                  issueIds: issueObj.ops[0]._id,
                },
              },
              {
                upsert: true,
              }
            );
            if (result.matchedCount > 0 || result.upsertedCount > 0) {
              return res.json(issueObj.ops[0]);
            } else {
              return res.status(500).json({ error: "could not insert" });
            }
          }
        },
        (error) => {
          res.status(500).json(error);
        }
      );
    })

    .put(async function (req, res) {
      const { _id, ...updates } = req.body;
      if (!_id) {
        return res.json({ error: "missing _id" });
      }
      !isNaN(updates.open) && (updates.open = stringToBool(updates.open));

      if (isObjEmpty(updates)) {
        return res.json({ error: "no update field(s) sent", _id });
      }
      await connectToDb(
        async (db) => {
          const issuesCollection = await db.collection("issues");
          const result = await issuesCollection.updateOne(
            {
              _id: ObjectID(_id),
            },
            {
              $set: {
                ...updates,
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
      let project = req.params.project;
      const { _id } = req.body;
      if (!_id) {
        return res.json({ error: "missing _id" });
      }
      await connectToDb(
        async (db) => {
          const projectsCollection = await db.collection("projects");
          const issuesCollection = await db.collection("issues");
          const result = await issuesCollection.deleteOne({
            _id: ObjectID(_id),
          });
          if (result.deletedCount > 0) {
            const projects = await projectsCollection.updateOne(
              { project },
              {
                $pull: {
                  issueIds: ObjectID(_id),
                },
              }
            );
            if (projects.matchedCount > 0 && projects.modifiedCount > 0) {
              return res.json({ result: "successfully deleted", _id });
            } else {
              return res.status(500).json({ error: "could not delete", _id });
            }
          } else {
            return res.json({ error: "could not delete", _id });
          }
        },
        (err) => {
          return res.json({ error: "could not delete", _id });
        }
      );
    });
};
