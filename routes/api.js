"use strict";

const { ObjectID, ObjectId } = require("mongodb");
const { isNaN, stringToBool, isObjEmpty } = require("../utils");
const { connectToDb } = require("../services/db");


module.exports = function (app) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      let queryData = req.query;
      !isNaN(queryData.open) && (queryData.open = stringToBool(queryData.open));
      !isNaN(queryData._id) && (queryData._id = ObjectID(queryData._id));
      try {
        const {db} = await connectToDb();
        const projectsCollection = db.collection("projects");
        const issuesCollection = db.collection("issues");
        const projectData = await projectsCollection
          .find({ project })
          .toArray();
          // console.log(projectData)
        const issues = await issuesCollection
          .find({
            _id: {
              $in: projectData.length != 0 ? projectData[0].issueIds : [],
            },
            ...queryData,
          })
          .toArray();
        res.json(issues);
      }
      catch(err){
        console.error(err);
        res.status(500).json({error: 'something went wrong'})
      }
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
      try {
        const {db} = await connectToDb();
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
      }
      catch(error){
        console.error(error);
        res.status(500).json(error);
      }
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
      try {
        const {db} = await connectToDb();
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
      }
      catch (error){
          console.error(error);
          res.json({ error: "could not update", _id });
      }
    })

    .delete(async function (req, res) {
      let project = req.params.project;
      const { _id } = req.body;
      if (!_id) {
        return res.json({ error: "missing _id" });
      }
      try {
        const {db} = await connectToDb();
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
            return res.status(500).json({ error: `deleted issue not found in project '${project}'`, _id });
          }
        } else {
          return res.json({ error: "could not delete", _id });
        }
      }
      catch(error){
        console.error(error);
        return res.json({ error: "could not delete", _id });
      }
    });
};
