const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const { connectToDb } = require("../db");
const testData = require("./testData");

chai.use(chaiHttp);

const errHandler = (error) => {
  // console.error(error);
  throw error;
};

suite("Functional Tests", function () {
  suiteSetup(async () => {
    await connectToDb(async (db) => {
      await db.deleteMany({
        project: testData.project,
      });
    }, errHandler);
  });
  test("Create an issue with every field: POST request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .post("/api/issues/" + testData.project)
      .send(testData.post1)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.project, testData.project);
        assert.equal(res.body.open, true);
        assert.equal(res.body.issue_text, testData.post1.issue_text);
        assert.equal(res.body.issue_title, testData.post1.issue_title);
        assert.equal(res.body.created_by, testData.post1.created_by);
        assert.equal(res.body.assigned_to, testData.post1.assigned_to);
        done();
      });
  });
  test("Create an issue with only required fields: POST request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .post("/api/issues/" + testData.project)
      .send(testData.post2)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.project, testData.project);
        assert.equal(res.body.open, true);
        assert.equal(res.body.issue_text, testData.post2.issue_text);
        assert.equal(res.body.issue_title, testData.post2.issue_title);
        assert.equal(res.body.created_by, testData.post2.created_by);
        done();
      });
  });
  test("Create an issue with missing required fields: POST request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .post("/api/issues/" + testData.project)
      .send({})
      .end((err, res) => {
        assert.equal(res.body.error, "required field(s) missing");
        done();
      });
  });
  test("View issues on a project: GET request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .get("/api/issues/" + testData.project)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.length, 2);
        done();
      });
  });
  test("View issues on a project with one filter: GET request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .get("/api/issues/" + testData.project + "?assigned_to=rahaman")
      .end((err, res) => {
        assert.equal(res.body.length, 1);
        done();
      });
  });
  test("View issues on a project with multiple filters: GET request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .get("/api/issues/" + testData.project + "?assigned_to=rahaman&open=true")
      .end((err, res) => {
        assert.equal(res.body.length, 1);
        done();
      });
  });
  test("Update one field on an issue: PUT request to /api/issues/{project}", async () => {
    await connectToDb(async (db) => {
      const insertedDoc = await db.insertOne(testData.post3);
      const res = await chai
        .request(server)
        .put("/api/issues/" + testData.project)
        .send({
          _id: insertedDoc.ops[0]._id,
          ...testData.put1,
        });
      assert.equal(res.status, 200);
      assert.equal(res.body.result, "successfully updated");
      assert.equal(res.body._id, insertedDoc.ops[0]._id);
    }, errHandler);
  });
  test("Update multiple fields on an issue: PUT request to /api/issues/{project}", async () => {
    await connectToDb(async (db) => {
      const insertedDoc = await db.insertOne(testData.post4);
      const res = await chai
        .request(server)
        .put("/api/issues/" + testData.project)
        .send({
          _id: insertedDoc.ops[0]._id,
          ...testData.put2,
        });
      let doc = res.body;
      assert.equal(res.status, 200);
      assert.equal(res.body.result, "successfully updated");
      assert.equal(res.body._id, insertedDoc.ops[0]._id);
    }, errHandler);
  });
  test("Update an issue with missing _id: PUT request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .put("/api/issues/" + testData.project)
      .send({ ...testData.put1 })
      .end((err, res) => {
        assert.equal(res.body.error, "missing _id");
        done();
      });
  });
  test("Update an issue with no fields to update: PUT request to /api/issues/{project}", async () => {
    await connectToDb(async (db) => {
      const insertedDoc = await db.insertOne(testData.post5);

      const res = await chai
        .request(server)
        .put("/api/issues/" + testData.project)
        .send({
          _id: insertedDoc.ops[0]._id,
        });
      assert.equal(res.body.error, "no update field(s) sent");
    }, errHandler);
  });
  test("Update an issue with an invalid _id: PUT request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .put("/api/issues/" + testData.project)
      .send({ _id: 1, ...testData.put1 })
      .end((err, res) => {
        assert.equal(res.body.error, "something went wrong");
        done();
      });
  });
  test("Delete an issue: DELETE request to /api/issues/{project}", async () => {
    await connectToDb(async (db) => {
      const insertedDoc = await db.insertOne(testData.post6);
      const res = await chai
        .request(server)
        .delete("/api/issues/" + testData.project)
        .send({
          _id: insertedDoc.ops[0]._id,
        });
      assert.equal(res.body._id, insertedDoc.ops[0]._id);
      assert.equal(res.body.result, "successfully deleted");
    }, errHandler);
  });
  test("Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .delete("/api/issues/" + testData.project)
      .send({ _id: 1 })
      .end((err, res) => {
        assert.equal(res.body.error, "could not delete");
        done();
      });
  });
  test("Delete an issue with missing _id: DELETE request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .delete("/api/issues/" + testData.project)
      .send({})
      .end((err, res) => {
        assert.equal(res.body.error, "missing _id");
        done();
      });
  });
});
