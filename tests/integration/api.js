var mocha = require('mocha');
var assert = require('assert');
var sqlFixtures = require('sql-fixtures');
var knexfile = require('../../knexfile');
var knex = require('knex')(knexfile.development);;

var test_data = require('../fixtures/test_data');

var app = require('../../src/app');
var request = require('supertest').agent(app.listen());

describe('api', function() {

  beforeEach(() => {
    return sqlFixtures.create(knexfile.development, test_data, (err, result) => {
        if (err) {
          console.log('Fixtures not loaded into db!', err, result);
        }
      });
  });

  afterEach(() => {
    return knex.schema
               .dropTable('projects')
               .dropTable('time_entries')
               .dropTable('activities')
               .dropTable('users')
               .then(sqlFixtures.destroy());
  });

  describe('GET /users', ()=> {
    it('should return the requested username', (cb) => {
      user = request.get('/users/1').expect(200, cb);
    });
  });

});
