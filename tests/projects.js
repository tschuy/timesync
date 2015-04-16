var mocha = require('mocha');
var assert = require('assert');
var sqlFixtures = require('sql-fixtures');
var knexfile = require('../knexfile');
var knex = require('knex')(knexfile.development);

var test_data = require('./fixtures/test_data');

var app = require('../src/app');
var request = require('supertest').agent(app.listen());

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

describe('GET /projects/42', ()=> {
  it('should return 404 for a non-existent project', (cb) => {
    request.get('/projects/42').expect(function(res) {
      assert.deepEqual(JSON.parse(res.error.text), {
        "error":"Object not found",
        "errno":1,
        "text":"Invalid project"
      });
    }).expect(404, cb);
  });
});

describe('DELETE /projects/1', ()=> {
  it('should delete the project for an existing project', (cb) => {
    request.delete('/projects/1').expect({
         "uri":"https://code.osuosl.org/projects/ganeti-webmgr",
         "name":"Ganeti Web Manager",
         "slug":"gwm",
         "owner": 2,
         "id": 1
    }).expect(200, cb)
    .end(() => {
        request.get('/projects/1')
        .expect(function(res) {
          assert.deepEqual(
            JSON.parse(res.error.text),
            {error: "Object not found", errno: 1, text:"Invalid project"});
        }).expect(404, cb);
      });;
  });
});

describe('DELETE /projects/42', ()=> {
  it('should return 404 for a non-existent project', (cb) => {
    request.delete('/projects/42').expect(function(res) {
      assert.deepEqual(
        JSON.parse(res.error.text),
        {error: "Object not found", errno: 1, text:"Invalid project"});
    }).expect(404, cb);
  });
});


describe('POST /projects/add', ()=> {
  it('should add a new project for Working Waterfronts', (cb) => {
    request
      .post('/projects/add?uri=https%3a%2f%2fgithub.com%2Fosu-cass%2fworking-waterfronts&name=Working%20Waterfronts&owner=tschuy')
      .expect(function(res) {
        assert.deepEqual(
          JSON.parse(res.body),
          {
            id: 4,
            name: 'Working Waterfronts',
            slug: 'working-waterfronts',
            uri: 'https://github.com/osu-cass/working-waterfronts',
            owner: 2
        });
      }).expect(200, () => {
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
  it('should fail when slug already exists', (cb) => {
    request
      .post('/projects/add?uri=https%3a%2f%2fgithub.com%2Fosu-cass%2fworking-waterfronts&name=Working%20Waterfronts&owner=tschuy&slug=wf')
      .expect(function(res) {
        assert.deepEqual(JSON.parse(res.error.text), {
          "error": "Database save failed",
          "errno":2,
          "text": "Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: projects.slug"
        });
      })
      .expect(400, cb);
  });
});

describe('POST /projects/add', ()=> {
  it('should fail when no name is passed', (cb) => {
    request
      .post('/projects/add?uri=https%3a%2f%2fgithub.com%2Fosu-cass%2fworking-waterfronts&owner=tschuy')
      .expect(function(res) {
        assert.deepEqual(JSON.parse(res.error.text), {
          "error": "No Name provided",
          "errno": 4,
          "text": "TypeError: Cannot read property 'toLowerCase' of undefined"}
          );
      })
      .expect(400, cb);
  });
});

describe('POST /projects/add', ()=> {
  it('should add a new project for Working Waterfronts with custom slug', (cb) => {
    request
      .post('/projects/add?uri=https%3a%2f%2fgithub.com%2Fosu-cass%2fworking-waterfronts&name=Working%20Waterfronts&owner=tschuy&slug=ww')
      .expect(function(res) {
        assert.deepEqual(
          JSON.parse(res.body),
          {
            'uri': 'https://github.com/osu-cass/working-waterfronts',
            'name': 'Working Waterfronts',
            'slug': 'ww',
            'owner': 2,
            'id': 4
          });
      }).expect(200, () => {
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
    request.post('/projects/add?owner=gibberish&name=test')
      .expect(function(res) {
        assert.deepEqual(
          JSON.parse(res.error.text),
          {
            errno: 3,
            error: "Invalid foreign key",
            text: "Invalid owner"
          });
      }).expect(400, cb);
  });
});
