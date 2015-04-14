var mocha = require('mocha');
var assert = require('assert');
var sqlFixtures = require('sql-fixtures');
var knexfile = require('../knexfile');
var knex = require('knex')(knexfile.development);;

var test_data = require('./fixtures/test_data');

var app = require('../src/app');
var request = require('supertest').agent(app.listen());


describe('api', function() {

  beforeEach(function(done) {
    this.timeout(5000);
    knex.raw('delete from projects').then(function(resp) {
      knex.raw('delete from sqlite_sequence where name=\'projects\'')
        .then(function(resp) {
          sqlFixtures.create(knexfile.development, test_data).then(function() {
            done();
          });
      });
    });
  });


  afterEach(function(done){
    this.timeout(5000);
    knex('projects').del().then(function() {
      knex('activities').del().then(function() {
        knex('users').del().then(function() {
          knex('time_entries').del().then(function() {
            sqlFixtures.destroy().then(function() {
              console.log('deleted everything successfully');
              done();
            });
          });
        });
      });
    });
  });



  describe('GET /users/1', ()=> {
    it('should return user profile for existing user', (cb) => {
      request.get('/users/1').expect(200, cb);
    });
  });

  describe('GET /users/42', ()=> {
    it('should return 404 for a non-existent user', (cb) => {
      request.get('/users/42').expect(404, cb);
    });
  });

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

  describe('GET /projects', ()=> {
    it('should return a list of projects', (cb) => {
      request.get('/projects').expect([
        {
           "uri":"https://code.osuosl.org/projects/ganeti-webmgr",
           "name":"Ganeti Web Manager",
           "slug":"gwm",
           "owner": 2,
           "id": 1
        },
        {
           "uri":"https://code.osuosl.org/projects/pgd",
           "name":"Protein Geometry Database",
           "slug":"pgd",
           "owner": 1,
           "id": 2
        },
        {
           "uri":"https://github.com/osu-cass/whats-fresh-api",
           "name":"Whats Fresh",
           "slug":"wf",
           "owner": 2,
           "id": 3
        }
      ]).expect(200, cb);
    });
  });

  describe('GET /projects/1', ()=> {
    it('should return the GWM project', (cb) => {
      request.get('/projects/1').expect({
           "uri":"https://code.osuosl.org/projects/ganeti-webmgr",
           "name":"Ganeti Web Manager",
           "slug":"gwm",
           "owner": 2,
           "id": 1
      }).expect(200, cb);
    });
  });

  describe('GET /time', ()=> {
    it('should return a list of time entries', (cb) => {
      request.get('/time').expect([
        {
          "duration":12,
          "user": 2,
          "project": 3,
          "activity": 2,
          "notes":"",
          "issue_uri":"https://github.com/osu-cass/whats-fresh-api/issues/56",
          "date_worked":null,
          "created_at":null,
          "updated_at":null,
          "id": 1
        }
      ]).expect(200, cb);
    });
  });

  describe('GET /time/1', ()=> {
    it('should return the first time entry', (cb) => {
      request.get('/time/1').expect({
        "duration":12,
        "user": 2,
        "project": 3,
        "activity": 2,
        "notes":"",
        "issue_uri":"https://github.com/osu-cass/whats-fresh-api/issues/56",
        "date_worked":null,
        "created_at":null,
        "updated_at":null,
        "id": 1
      }).expect(200, cb);
    });
  });


  describe('POST /projects/add', ()=> {
    it('should add a new project for Working Waterfronts', (cb) => {
      request
        .post('/projects/add?uri=https%3a%2f%2fgithub.com%2Fosu-cass%2fworking-waterfronts&name=Working%20Waterfronts&owner=tschuy')
        .expect(200, () => {
          request.get('/projects/4').expect({
            'uri': 'https://github.com/osu-cass/working-waterfronts',
            'name': 'Working Waterfronts',
            'slug': 'working-waterfronts',
            'owner': 2,
            'id': 4
          }).expect(200, cb);
        });
    });
  });

  describe('POST /projects/add', ()=> {
    it('should add a new project for Working Waterfronts with custom slug', (cb) => {
      request
        .post('/projects/add?uri=https%3a%2f%2fgithub.com%2Fosu-cass%2fworking-waterfronts&name=Working%20Waterfronts&owner=tschuy&slug=ww')
        .expect(200, () => {
          request.get('/projects/4').expect({
            'uri': 'https://github.com/osu-cass/working-waterfronts',
            'name': 'Working Waterfronts',
            'slug': 'ww',
            'owner': 2,
            'id': 4
          }).expect(200, cb);
        });
    });
  });

  describe('POST /projects/add', ()=> {
    it('should fail when given a gibberish owner', (cb) => {
      request.post('/projects/add?owner=gibberish&name=test').expect(400, cb);
    });
  });

});