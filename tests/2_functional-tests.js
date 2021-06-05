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
    issue_text: "post1_text",
    issue_title: "post1 title",
    created_by: "afroz",
    assigned_to: "rahaman",
  },
  post2: {
    open: true,
    issue_text: "post2_text",
    issue_title: "post2 title",
    created_by: "afroz",
  },
  post3: {
    open: true,
    issue_text: "post3",
    issue_title: "post3 title",
    created_by: "afroz",
  },
  post4: {
    open: true,
    issue_text: "post4",
    issue_title: "post4 title",
    created_by: "rahaman",
  },
  post5: {
    open: true,
    issue_text: "post5",
    issue_title: "post5 title",
    created_by: "rahaman",
  },
  post6: {
    open: true,
    issue_text: "post6",
    issue_title: "post6 title",
    created_by: "chotu",
  },
  put1: {
    open: false,
  },
  put2: {
    open: false,
    issue_text: "put2 text",
    issue_title: "put2 title",
    created_by: "afroz",
  },
};
suite("Functional Tests", function () {
  suiteSetup((done) => {
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
  test("Update one field on an issue: PUT request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .post("/api/issues/" + testData.project)
      .send(testData.post3)
      .then((res) => {
        chai
          .request(server)
          .put("/api/issues/" + testData.project)
          .send({
            _id: res.body._id,
            ...testData.put1,
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.body.open, false);
            done();
          });
      });
  });
  test("Update multiple fields on an issue: PUT request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .post("/api/issues/" + testData.project)
      .send(testData.post4)
      .then((res) => {
        chai
          .request(server)
          .put("/api/issues/" + testData.project)
          .send({
            _id: res.body._id,
            ...testData.put2,
          })
          .end((err, res) => {
            let doc = res.body;
            assert.equal(res.status, 200);
            assert.equal(doc.open, testData.put2.open);
            assert.equal(doc.issue_text, testData.put2.issue_text);
            assert.equal(doc.issue_title, testData.put2.issue_title);
            done();
          });
      });
  });
  test("Update an issue with missing _id: PUT request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .put("/api/issues/" + testData.project)
      .send({ ...testData.put1 })
      .end((err, res) => {
        assert.isNull(res.body);
        done();
      });
  });
  test("Update an issue with no fields to update: PUT request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .post("/api/issues/" + testData.project)
      .send(testData.post5)
      .then((res) => {
        chai
          .request(server)
          .put("/api/issues/" + testData.project)
          .send({
            _id: res.body._id,
          })
          .end((err, res) => {
            assert.equal(res.status, 500);
            done();
          });
      });
  });
  test("Update an issue with an invalid _id: PUT request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .put("/api/issues/" + testData.project)
      .send({ _id: 1, ...testData.put1 })
      .end((err, res) => {
        assert.isNull(res.body);
        done();
      });
  });
  test("Delete an issue: DELETE request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .post("/api/issues/" + testData.project)
      .send(testData.post6)
      .then((res1) => {
        chai
          .request(server)
          .delete("/api/issues/" + testData.project)
          .send({ _id: res1.body._id })
          .end((err, res2) => {
            assert.equal(res1.body._id, res2.body._id);
            done();
          });
      });
  });
  test("Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .delete("/api/issues/" + testData.project)
      .send({ _id: 1 })
      .end((err, res) => {
        assert.isNull(res.body);
        done();
      });
  });
  test("Delete an issue with missing _id: DELETE request to /api/issues/{project}", (done) => {
    chai
      .request(server)
      .delete("/api/issues/" + testData.project)
      .send({})
      .end((err, res) => {
        assert.isNull(res.body);
        done();
      });
  });
});
