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

  describe('DELETE /time/1', ()=> {
    it('should delete the time entry for an existing time entry', (cb) => {
      request.delete('/time/1').expect({
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
        }).expect(200, cb)
      .end(() => {
          request.get('/time/1')
          .expect(function(res) {
            assert.deepEqual(
              JSON.parse(res.error.text),
              {error: "Object not found", errno: 1, text:"Invalid time entry"});
          }).expect(404, cb);
        });;
    });
  });

  describe('DELETE /time/42', ()=> {
    it('should return 404 for a non-existent time entry', (cb) => {
      request.delete('/time/42').expect(function(res) {
        assert.deepEqual(
          JSON.parse(res.error.text),
          {error: "Object not found", errno: 1, text:"Invalid time entry"});
      }).expect(404, cb);
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

    it('should not have created a new time entry with a null activity', (cb) => {
      request
        .post('/time/add?project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end(() => {
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
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

    it('should not have created a new time entry with a bad activity', (cb) => {
      request
        .post('/time/add?project=gwm&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&activity=notanactivity')
        .end(() => {
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
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
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
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
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
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
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
        });
    });

    it('should fail to add a new time entry with null user', (cb) => {
      request
        .post('/time/add?activity=doc&project=gwm&notes=notes&duration=54&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .expect(function(res) {
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
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
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
        .end(() => {
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
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
        .end(() => {
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
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
        .end(() => {
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
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
        .end(() => {
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
        });
    });

  });

  describe('POST /time/update', ()=> {

    it('should not update a non-existent time entry', (cb) => {
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
          request.get('/time/2')
          .expect(function(res) {
            assert.deepEqual(JSON.parse(res.error.text), {
              "error": "Object not found",
              "errno": 1,
              "text": "Invalid time entry"
            });
          }).expect(404, cb);
        });
    });

    // TODO: all of the /time/update tests need to
    // TODO: This shouldn't 404, it should return the old object
    it('should error given a new time entry with a bad activity', (cb) => {
      request
        .post('/time/update?id=1&project=wf&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&activity=notanactivity')
        .end(() => {
          request.get('/time/1').expect({}).expect(200).end(cb);
        });
    });

    // TODO: This shouldn't 404, it should return the old object
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

    // TODO: This shouldn't 404, it should return the old object
    it('should fail to update a new time entry with a bad project', (cb) => {
      request
        .post('/time/update?id=1&activity=wf&notes=notes&duration=54&user=deanj&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1&project=notaproject')
        .end(() => {
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
      }).expect(200).end(cb);
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

    // TODO: This shouldn't 404, it should return the old object
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

    // TODO: This shouldn't 404, it should return the old object
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

    // TODO: This shouldn't 404, it should return the old object
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

    // TODO: This shouldn't 404, it should return the old object
    it('should fail to update a new time entry with no user', (cb) => {
      request
        .post('/time/update?id=1&activity=doc&project=gwm&notes=notes&duration=54&issue_uri=https%3a%2f%2fgithub.com%2fosuosl%2fganeti_webmgr%2fissues%2f1')
        .end((res) => {
          request.get('/time/2').expect({}).expect(404).end(cb);
        });
    });

  });

});
