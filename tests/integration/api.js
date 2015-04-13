var mocha = require('mocha');
var assert = require('assert');
var sqlFixtures = require('sql-fixtures');
var knexfile = require('../../knexfile');
var knex = require('knex')(knexfile.development);;

var test_data = require('../fixtures/test_data');

var app = require('../../src/app');
var request = require('supertest').agent(app.listen());

describe('api', function() {

  beforeEach(function(done) {
    this.timeout(5000);
    console.log('beginning import');
    sqlFixtures.create(knexfile.development, test_data).then(function() {
      console.log('import complete');
      done();
    });
  });


  afterEach(function(done){
    this.timeout(5000);
    console.log('beginning purge');
    knex('projects').del().then(function() {
      console.log('projects deleted');
      knex('activities').del().then(function() {
        console.log('activities deleted');
        knex('users').del().then(function() {
          console.log('users deleted');
          knex('time_entries').del().then(function() {
            console.log('time entries deleted');
            sqlFixtures.destroy().then(function() {
              console.log('db cleared');
              done();
      });});});
    });});
  });



  describe('GET /users/1', ()=> {
    it('should return user profile for existing user', (cb) => {
      user = request.get('/users/1').expect(200, cb);
    });
  });

  describe('GET /users/42', ()=> {
    it('should return 404 for a non-existent user', (cb) => {
      user = request.get('/users/42').expect(404, cb);
    });
  });


});
