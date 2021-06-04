const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");
const myDB = require("../connection");

chai.use(chaiHttp);

const testData = {
  project: "test",
  post1: {
    open: true,
    issue_text: "hello",
    issue_title: "Hello oy",
    created_by: "afroz",
    assigned_to: "rahaman",
  },
  post2: {
    open: true,
    issue_text: "hello",
    issue_title: "Hello oy",
    created_by: "afroz",
  },
};
suite("Functional Tests", function () {
  before((done) => {
    myDB(async (client) => {
      const myDataBase = await client
        .db("myFirstDBTests")
        .collection("QA-issues");
      try {
        await myDataBase.deleteMany({
          project: testData.project,
        });
        done();
      } catch (error) {
        console.error(error);
      }
    });
  });
  test("Create an issue with every field: POST request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .post("/api/issues/" + testData.project)
      .send(testData.post1)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.project, testData.project);
        assert.equal(res.body.open, testData.post1.open);
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
        assert.equal(res.body.open, testData.post2.open);
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
        assert.equal(res.status, 500);
        assert.notStrictEqual(res.body, {});
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
      .get("/api/issues/" + testData.project)
      .end((err, res) => {
        done();
      });
  });
  test("View issues on a project with multiple filters: GET request to /api/issues/{project}", (done) => {});
  test("Update one field on an issue: PUT request to /api/issues/{project}", (done) => {});
  test("Update multiple fields on an issue: PUT request to /api/issues/{project}", (done) => {});
  test("Update an issue with missing _id: PUT request to /api/issues/{project}", (done) => {});
  test("Update an issue with no fields to update: PUT request to /api/issues/{project}", (done) => {});
  test("Update an issue with an invalid _id: PUT request to /api/issues/{project}", (done) => {});
  test("Delete an issue: DELETE request to /api/issues/{project}", (done) => {});
  test("Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", (done) => {});
  test("ete an issue with missing _id: DELETE request to /api/issues/{projec", (done) => {});
});
