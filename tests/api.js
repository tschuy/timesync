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
    // Clear SQLite indexes
    knex.raw('delete from sqlite_sequence').then(function(resp) {
      sqlFixtures.create(knexfile.development, test_data).then(function() {
        done();
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
              done();
            });
          });
        });
      });
    });
  });



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

  describe('POST /time/add', ()=> {
    it('should add a new time entry', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(function(res) {
          var result = JSON.parse(res.body);
          delete result['created_at'];
          assert.deepEqual(
            result,
            {
              'issue_uri': 'https://github.com/osuosl/ganeti_webmgr/issues/1',
              'user': 1,
              'notes': 'notes',
              'activity': 1,
              'project': 1,
              'duration': 54 * 60,
              'updated_at': null,
              'date_worked': null,
              'id': 2
          });
        }).expect(200, () => {
          var sent_time =  (new Date).getTime();
          request.get('/time/2').expect(function(res){
            var result = JSON.parse(res.text);
            if(Math.abs(sent_time - result.created_at) > 100) {
              assert.equal(sent_time, result.created_at);
            }
            if(Math.abs(sent_time - result.date_worked) > 100) {
              assert.equal(sent_time, result.date_worked);
            }
            delete result['created_at'];
            delete result['date_worked'];
            var expected_result = {
              'issue_uri': 'https://github.com/osuosl/ganeti_webmgr/issues/1',
              'user': 1,
              'notes': 'notes',
              'activity': 1,
              'project': 1,
              'duration': 54 * 60,
              'updated_at': null,
              'id': 2
            };
            assert.deepEqual(result, expected_result);
          }).expect(200, cb);
        });
    });
  });

  describe('GET /time/:id', ()=> {
    it('should return an existing object', (cb) => {
      request
        .get('/time/1')
        .expect(200)
        .expect({
          "duration":12,
          "user": 2,
          "project": 3,
          "activity": 2,
          "notes": "",
          "issue_uri": "https://github.com/osu-cass/whats-fresh-api/issues/56",
          "date_worked": null,
          "created_at": null,
          "updated_at": null,
          "id": 1
        })
        .end(cb);
    });

    it('should not return a non-existent object', (cb) => {
      request
        .get('/time/2')
        .expect(404)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Object not found",
            "errno": 1,
            "text": "Invalid time entry"
          });
        }).end(cb);
    });
  });

  describe('POST /time/add', ()=> {
    it('should fail to add a new time entry with null activity', (cb) => {
      request
        .post('/time/add?project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Database save failed",
            "errno": 2,
            "text": "Error: SQLITE_CONSTRAINT: NOT NULL constraint failed: time_entries.activity"
          });
        }).end(cb);

    });

    it('should not create a new time entry with a null activity', (cb) => {
      request
        .post('/time/add?project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to add a new time entry with bad activity', (cb) => {
      request
        .post('/time/add?project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&activity=notanactivity')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Invalid foreign key",
            "errno": 3,
            "text": "Invalid activity"
          });
        }).end(cb);

    });

    it('should not have created a new time entry with a null activity', (cb) => {
      request
        .post('/time/add?project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to add a new time entry with null project', (cb) => {
      request
        .post('/time/add?activity=doc&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Invalid foreign key",
            "errno": 3,
            "text": "Invalid project"
          });
        }).end(cb);
    });

    it('should not have created a new time entry with null project', (cb) => {
      request
        .post('/time/add?activity=doc&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to add a new time entry with a bad project', (cb) => {
      request
        .post('/time/add?activity=doc&project=notaproject&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Invalid foreign key",
            "errno": 3,
            "text": "Invalid project"
          });
        }).end(cb);
    });

    it('should not have created a new time entry with a bad project', (cb) => {
      request
        .post('/time/add?activity=doc&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&project=notaproject')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });


    it('should fail to add a new time entry given an invalid date', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&date=notadate')
        .expect(400)
        .expect(function(res) {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "The provided value wasn't valid",
            "errno": 5,
            "text": "notadate"
            });
        }).end(cb);
    });

    it('should not have created a new time entry with a bad date', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&date=notadate')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to add a new time entry with null user', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(function(res) {
          console.log(res.error.text);
          assert.deepEqual(JSON.parse(res.error.text), {
            "errno": 3,
            "error": "Invalid foreign key",
            "text": "Invalid user"
          });
        })
        .expect(400)
        .end(cb);
    });

    it('should not have created a new time entry with null user', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to add a new time entry with null duration', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "errno": 5,
            "error": "The provided value wasn't valid"
          });
        }).end(cb);
    });

    it('should not have created a new time entry with a null duration', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end((res) => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to add a new time entry with bad duration', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=gibberish&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "errno": 5,
            "error": "The provided value wasn't valid"
          });
        }).end(cb);
    });

    it('should not have created a new time entry with bad duration', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=gibberish&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end((res) => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to add a new time entry with bad user', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&user=notauser&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "errno": 3,
            "error": "Invalid foreign key",
            "text": "Invalid user"
          });
        }).end(cb);
    });

    it('should not have created a new time entry with bad user', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&user=notauser&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end((res) => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to add a new time entry with no user', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "errno": 3,
            "error": "Invalid foreign key",
            "text": "Invalid user"
          });
        }).end(cb);
    });

    it('should not have created a new time entry with no user', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end((res) => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

  });

  describe('POST /time/update', ()=> {

    it('should not update a non-existant time entry', (cb) => {
      request
        .post('/time/update?id=201&duration=21')
        .expect(404)
        .expect({
          'error': "Object not found",
          'errno': 1,
          'text': "Invalid id"
        })
        .end(cb);
    });

    it('should successfully update a valid time entry', (cb) => {
      request
        .post('/time/update?id=1&duration=21')
        .expect(200)
        .expect({
          "duration": 21,
          "user": 2,
          "project": 3,
          "activity": 2,
          "notes":"",
          "issue_uri":"https://github.com/osu-cass/whats-fresh-api/issues/56",
          "date_worked": null,
          "created_at": null,
          "updated_at": null,
          "id": 1
        })
        .end(cb);
    });

    it('should not insert a new time entry', (cb) => {
      request
        .post('/time/update?id=1&duration=21')
        .end(() => {
          request
            .get('/time/2')
            .expect(404)
            .end(cb);
        });
    });

    it('should error given a new time entry with a bad activity', (cb) => {
      request
        .post('/time/update?id=1&project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&activity=notanactivity')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should fail to update a new time entry with bad activity', (cb) => {
      request
        .post('/time/update?id=1&project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&activity=notanactivity')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Invalid foreign key",
            "errno": 3,
            "text": "Invalid activity"
          });
        }).end(cb);

    });

    it('should error given a new time entry with a bad project', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=notaproject&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "Invalid foreign key",
            "errno": 3,
            "text": "Invalid project"
          });
        }).end(cb);
    });

    it('should fail to update a new time entry with a bad project', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&project=notaproject')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });


    it('should respond with an error given a time entry with bad date', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=54&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&date=notadate')
        .expect(400)
        .expect(function(res) {
          assert.deepEqual(JSON.parse(res.error.text), {
            "error": "The provided value wasn't valid",
            "errno": 5,
            "text": "notadate"
            });
        }).end(cb);
    });

    it('should not have a new time entry after updateing a bad date', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=54&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&date=notadate')
        .end(() => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should error given a new time entry with bad duration', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=gibberish&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "errno": 5,
            "error": "The provided value wasn't valid"
          });
        }).end(cb);
    });

    it('should fail to update a new time entry with bad duration', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=gibberish&user=tschuy&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end((res) => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should error given a new time entry with bad user', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=54&user=notauser&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "errno": 3,
            "error": "Invalid foreign key",
            "text": "Invalid user"
          });
        }).end(cb);
    });

    it('should fail to update a new time entry with bad user', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=54&user=notauser&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end((res) => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

    it('should error given a new time entry with no user', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=54&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(400)
        .expect((res) => {
          assert.deepEqual(JSON.parse(res.error.text), {
            "errno": 3,
            "error": "Invalid foreign key",
            "text": "Invalid user"
          });
        }).end(cb);
    });

    it('should fail to update a new time entry with no user', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=54&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end((res) => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

  });

});
