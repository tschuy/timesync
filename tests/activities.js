var mocha = require('mocha');
var assert = require('assert');
var sqlFixtures = require('sql-fixtures');
var knexfile = require('../knexfile');
var knex = require('knex')(knexfile.development);

var test_data = require('./fixtures/test_data');

var app = require('../src/app');
var request = require('supertest').agent(app.listen());

describe('GET /activities', ()=> {
    it('should return a list of activities', (cb) => {
      request.get('/activities').expect([
          {
             "name":"Documentation",
             "slug":"doc",
             "id": 1
          },
          {
             "name":"Development",
             "slug":"dev",
             "id": 2
          },
          {
             "name":"Systems",
             "slug":"sys",
             "id": 3
          }
      ]).expect(200, cb);
    });
  });

  describe('GET /activities/1', ()=> {
    it('should return the Documentation activity', (cb) => {
      request.get('/activities/1').expect({
        "name":"Documentation",
        "slug":"doc",
        "id": 1
      }).expect(200, cb);
    });
  });

  describe('GET /activities/42', ()=> {
    it('should return 404 for a non-existent activity', (cb) => {
      request.get('/activities/42').expect(function(res) {
        assert.deepEqual(JSON.parse(res.error.text), {
          "error":"Object not found",
          "errno":1,
          "text":"Invalid activity"
        });
      }).expect(404, cb);
    });
  });

  describe('DELETE /activities/1', ()=> {
    it('should delete the activity for an existing activity', (cb) => {
      request.delete('/activities/1').expect({
        "name":"Documentation",
        "slug":"doc",
        "id": 1
      }).expect(200, cb)
      .end(() => {
          request.get('/activities/1')
          .expect(function(res) {
            assert.deepEqual(
              JSON.parse(res.error.text),
              {error: "Object not found", errno: 1, text:"Invalid activity"});
          }).expect(404, cb);
        });;
    });
  });

  describe('DELETE /activities/42', ()=> {
    it('should return 404 for a non-existent activity', (cb) => {
      request.delete('/activities/42').expect(function(res) {
        assert.deepEqual(
          JSON.parse(res.error.text),
          {error: "Object not found", errno: 1, text:"Invalid activity"});
      }).expect(404, cb);
    });
  });


  describe('POST /activities/add', ()=> {
    it('should add a new activity', (cb) => {
      request
        .post('/activities/add?name=Testing%20Activity')
        .expect(function(res) {
          assert.deepEqual(
            JSON.parse(res.body),
            {
              id: 4,
              'name': 'Testing Activity',
              'slug': 'testing-activity',
              owner: 2
          });
        }).expect(200, () => {
          request.get('/activities/4').expect({
            'name': 'Testing Activity',
            'slug': 'testing-activity',
            'id': 4
          }).expect(200, cb);
        });
    });
  });

  describe('POST /activities/add', ()=> {
    it('should add a new activity', (cb) => {
      request
        .post('/activities/add?name=Testing%20Activity&slug=testing')
        .expect(function(res) {
          assert.deepEqual(
            JSON.parse(res.body),
            {
              id: 4,
              'name': 'Testing Activity',
              'slug': 'testing',
              owner: 2
          });
        }).expect(200, () => {
          request.get('/activities/4').expect({
            'name': 'Testing Activity',
            'slug': 'testing',
            'id': 4
          }).expect(200, cb);
        });
    });
  });

  describe('POST /activities/add', ()=> {
    it('should fail when slug already exists', (cb) => {
      request
        .post('/activities/add?name=Testing%20Activity&slug=dev')
        .expect(function(res) {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Database save failed",
            "errno":2,
            "text": "Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: activities.slug"
          });
        })
        .expect(400, cb);
    });
  });

  describe('POST /activities/add', ()=> {
    it('should fail when no name is passed', (cb) => {
      request
        .post('/activities/add?slug=dev')
        .expect(function(res) {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Database save failed",
            "errno": 2,
            "text": "Error: SQLITE_CONSTRAINT: NOT NULL constraint failed: activities.name"
          });
        })
        .expect(400, cb);
    });
  });
