"use strict";

const { ObjectID } = require("mongodb");

module.exports = function (app, myDataBase) {
  app
    .route("/api/issues/:project")

    .get(async function (req, res) {
      let project = req.params.project;
      try {
        const data = await myDataBase
          .find({ project })
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
      data.open = 1;
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

      const { _id, open } = req.body;
      myDataBase
        .findOneAndUpdate(
          {
            _id: ObjectID(_id),
          },
          {
            $set: {
              open: open == "false" ? 0 : 1,
            },
          }
        )
        .then((doc) => {
          res.json(doc.value);
        })
        .catch((err) => {
          res.status(500).send("error deleting doc!");
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
