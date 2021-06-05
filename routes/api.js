"use strict";

const { ObjectID } = require("mongodb");
const { isNaN, toBool } = require("../utils");

module.exports = function (app, myDataBase) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      let queryData = req.query;
      !isNaN(queryData.open) &&
        (queryData.open = queryData.open == "true" ? true : false);

      try {
        const data = await myDataBase
          .find({ project, ...queryData })
          .sort({ created_on: 1 })
          .toArray();
        res.json(data);
      } catch (error) {
        res.status(500).json(error);
      }
    })

    .post(function (req, res) {
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
      myDataBase.insertOne(data, (err, doc) => {
        if (err) {
          res.status(500).json(err);
          return;
        }
        res.json(doc.ops[0]);
      });
    })

    .put(function (req, res) {
      // let project = req.params.project;

      const { _id, open, ...otherUpdates } = req.body;
      const isOpen = !isNaN(open) ? { open: toBool(open) } : {};
      myDataBase
        .findOneAndUpdate(
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
        )
        .then((doc) => {
          res.json(doc.value);
        })
        .catch((err) => {
          res.status(500).send("error updating doc!");
          return;
        });
    })

    .delete(function (req, res) {
      // let project = req.params.project;
      const { _id } = req.body;
      myDataBase.findOneAndDelete(
        {
          _id: ObjectID(_id),
        },
        (err, doc) => {
          if (err) {
            res.status(500).send("error deleting doc!");
            return;
          }
          res.json(doc.value);
        }
      );
    });
};
