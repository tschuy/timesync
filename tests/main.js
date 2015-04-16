var mocha = require('mocha');
var assert = require('assert');
var sqlFixtures = require('sql-fixtures');
var knexfile = require('../knexfile');
var knex = require('knex')(knexfile.development);

var test_data = require('./fixtures/test_data');

var app = require('../src/app');
var request = require('supertest').agent(app.listen());

describe('api', function() {
  this.timeout(5000);

  beforeEach(function(done) {
    // Clear SQLite indexes
    knex.raw('delete from sqlite_sequence').then(function(resp) {
      sqlFixtures.create(knexfile.development, test_data).then(function() {
        done();
      });
    });
  });


  afterEach(function(done){
    knex('projects').del().then(function() {
      knex('activities').del().then(function() {
        knex('users').del().then(function() {
          knex('time_entries').del().then(function() {
            sqlFixtures.destroy().then(function() {
              done();
            });
          });
        });
      });
    });
  });

  require('./users');
  require('./activities');
  require('./projects');
  require('./time');

});
