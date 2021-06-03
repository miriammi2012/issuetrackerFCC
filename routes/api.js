"use strict";

const { ObjectId } = require("mongodb");

module.exports = function (app, myDataBase) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      try {
        const data = await myDataBase.findOne({ project });
        res.json(data.issues);
      } catch (error) {
        res.status(500).json(error);
      }
    })

    .post(function (req, res) {
      let project = req.params.project;
      const data = req.body;
      data._id = ObjectId();
      data.open = true;
      myDataBase.findOneAndUpdate(
        { project },
        {
          $push: {
            issues: data,
          },
        },
        {
          upsert: true,
        },
        (err, doc) => {
          if (err) {
            res.status(500).json(err);
            return;
          }
          res.json(doc.value);
        }
      );
    })

    .put(function (req, res) {
      let project = req.params.project;
    })

    .delete(function (req, res) {
      let project = req.params.project;
    });
};
