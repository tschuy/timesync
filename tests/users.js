var mocha = require('mocha');
var assert = require('assert');
var sqlFixtures = require('sql-fixtures');
var knexfile = require('../knexfile');
var knex = require('knex')(knexfile.development);

var test_data = require('./fixtures/test_data');

var app = require('../src/app');
var request = require('supertest').agent(app.listen());

describe('GET /users/1', ()=> {
  it('should return user profile for existing user', (cb) => {
    request.get('/users/1').expect(function(res) {
      assert.deepEqual(res.body, { id: 1, username: 'deanj' });
    }).expect(200, cb);
  });
});

describe('GET /users/42', ()=> {
  it('should return 404 for a non-existent user', (cb) => {
    request.get('/users/42').expect(function(res) {
      assert.deepEqual(
        JSON.parse(res.error.text),
        {error: "Object not found", errno: 1, text:"Invalid user"});
    }).expect(404, cb);
  });
});

describe('DELETE /users/1', ()=> {
  it('should delete the user profile for an existing user', (cb) => {
    request.delete('/users/1').expect(function(res) {
      assert.deepEqual(res.body, { id: 1, username: 'deanj' });
    }).expect(200, cb)
    .end(() => {
        request.get('/users/1')
        .expect(function(res) {
          assert.deepEqual(
            JSON.parse(res.error.text),
            {error: "Object not found", errno: 1, text:"Invalid user"});
        }).expect(404, cb);
      });;
  });
});

describe('DELETE /users/42', ()=> {
  it('should return 404 for a non-existent user', (cb) => {
    request.delete('/users/42').expect(function(res) {
      assert.deepEqual(
        JSON.parse(res.error.text),
        {error: "Object not found", errno: 1, text:"Invalid user"});
    }).expect(404, cb);
  });
});
