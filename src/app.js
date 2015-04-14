"use strict";

var koa = require('koa');
var _ = require('koa-route');
var knex = require('koa-knex');
var app = module.exports = koa();

app.use(knex({
    client: 'sqlite3',
    connection: {
        filename: './dev.sqlite3'
    }
}));

var DATABASE_SAVE_ERROR = 19;

// strip non-alphanumeric, non-hyphens
function createSlugFrom(name) {
    return name.toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^\w-]+/g, '');
}

function errorObjectNotFound(object) {
    return JSON.stringify({
        'error': "Object not found",
        'errno': 1,
        'text': "Invalid " + object
    });
}

function errorDatabaseSaveFailed(sql_error) {
    return JSON.stringify({
        'error': "Database save failed",
        'errno': 2,
        'text': sql_error
    });
}

function errorInvalidForeignKey(object) {
    return JSON.stringify({
        'error': "Invalid foreign key",
        'errno': 3,
        'text': "Invalid " + object
    });
}

function errorNoNameProvided(error) {
    return JSON.stringify({
        'error': "No Name provided",
        'errno': 4,
        'text': error
    });
}

// Users
app.use(_.get('/users/:userid', function *(userid) {
    var user = (yield this.knex('users').where('id', userid))[0];
    if (!user) this.throw(404, errorObjectNotFound('user'));
    this.body = user;
}));

app.use(_.get('/users', function *() {
    this.body = yield this.knex('users');
}));

app.use(_.post('/users/add', function *() {
    try {
        var id = (yield this.knex('users').insert(
            {username: this.request.query.username}))[0];

        this.body = yield this.knex('users').where('id', id);
    } catch(error) {
        if(error.errno == DATABASE_SAVE_ERROR) {
            this.body = errorDatabaseSaveFailed(String(error));
            this.status = 400;
            return;
        } else {
            throw(error);
        }
    }
}));

app.use(_.post('/users/update', function *() {
    try {
        var id = (yield this.knex('users')
                   .select('id')
                   .where({
                     username: this.request.query.username
                   })
                 )[0];
        if (id === undefined) {
            this.body = errorObjectNotFound(this.request.query.username);
            this.status = 404;
            return;
        }
        yield this.knex('users')
          .update({
            username: this.request.query.new_username
          })
          .where({
            'id': id
          });

        this.body = id;
    } catch(error) {
        if(error.errno == DATABASE_SAVE_ERROR) {
            this.body = errorDatabaseSaveFailed(String(error));
            this.status = 400;
            return;
        } else {
            throw(error);
        }
    }
}));



// Projects
app.use(_.get('/projects', function *() {
    this.body = yield this.knex('projects');
}));

app.use(_.post('/projects/add', function *() {
    var slug = this.request.query.slug;
    try {
        if(! slug) slug = createSlugFrom(this.request.query.name);
    } catch(error) {
        if(error.name.toString() == 'TypeError') {
            this.throw(400, errorNoNameProvided(String(error)));
        } else {
            throw(error);
        }
    }
    var owner_id;
    try {
        owner_id = (yield this.knex('users').where('username', this.request.query.owner))[0].id;
    } catch(error) {
        if(error.name.toString() == 'TypeError') {
            this.throw(400, errorInvalidForeignKey('owner'));
        } else {
            throw(error);
        }
    }
    try {
        var id = (yield this.knex('projects').insert(
            {name: this.request.query.name,
             slug: slug,
             uri: this.request.query.uri,
             owner: owner_id}))[0];

        this.body = yield this.knex('projects').where('id', id);
    } catch(error) {
        if(error.errno == DATABASE_SAVE_ERROR) {
            this.body = errorDatabaseSaveFailed(String(error));
            this.status = 400;
            return;
        } else {
            throw(error);
        }
    }
}));

app.use(_.get('/projects/:projectid', function *(projectid) {
    var project = (yield this.knex('projects').where('id', projectid))[0];
    if (!project) this.throw(404, errorObjectNotFound('project'));
    this.body = project;
}));

// Activities
app.use(_.get('/activities', function *() {
    this.body = yield this.knex('activities');
}));

app.use(_.post('/activities/add', function *() {
    var slug = this.request.query.slug;
    if(! slug) slug = createSlugFrom(this.request.query.name);
    try {
        var id = (yield this.knex('activities').insert(
            {name: this.request.query.name,
            slug: slug}))[0];

        this.body = yield this.knex('activities').where('id', id);
    } catch(error) {
        if(error.errno == DATABASE_SAVE_ERROR) {
            this.body = errorDatabaseSaveFailed(String(error));
            this.status = 400;
            return;
        } else {
            throw(error);
        }
    }
}));

app.use(_.get('/activities/:activityid', function *(activityid) {
    var activity = (yield this.knex('activities').where('id', activityid))[0];
    if (!activity) this.throw(404, errorObjectNotFound('activity'));
    this.body = activity;
}));

// Time events
app.use(_.get('/time', function *() {
    this.body = yield this.knex('time_entries');
}));

app.use(_.post('/time/add', function *() {
    var activity = this.request.query.activity;
    var project = this.request.query.project;
    var user = this.request.query.user;

    var project_id, user_id;

    var activity_id = null;
    if(activity) {
        // TODO: fuzzy matching
        try {
            activity_id = (yield this.knex('activities').where('slug', activity))[0].id;
        } catch(error) {
            if(error.name.toString() == 'TypeError') {
                this.body = errorInvalidForeignKey('activity');
                this.status = 400;
                return;
            } else {
                throw(error);
            }
        }
    }
    // TODO: fuzzy matching
    try {
        project_id = (yield this.knex('projects').where('slug', project))[0].id;
    } catch(error) {
        if(error.name.toString() == 'TypeError') {
            this.body = errorInvalidForeignKey('project');
            this.status = 400;
            return;
        } else {
            throw(error);
        }
    }
    try {
        user_id = (yield this.knex('users').where('username', user))[0].id;
    } catch(error) {
        if(error.name.toString() == 'TypeError') {
            this.body = errorInvalidForeignKey('user');
            this.status = 400;
            return;
        } else {
            throw(error);
        }
    }
    var duration = this.request.query.duration * 60; // convert duration from minutes to seconds
    try {
        var id = (yield this.knex('time_entries').insert({
            duration: duration,
            user: user_id,
            project: project_id,
            activity: activity_id,
            notes: this.request.query.notes,
            issue_uri: this.request.query.issue_uri,
            date_worked: Date.parse(this.request.query.date),
            created_at: Date.now()
        }))[0];

        this.body = yield this.knex('time_entries').where('id', id);
    } catch(error) {
        if(error.errno == DATABASE_SAVE_ERROR) {
            this.body = errorDatabaseSaveFailed(String(error));
            this.status = 400;
            return;
        } else {
            throw(error);
        }
    }
}));

app.use(_.get('/time/:timeid', function *(timeid) {
    var time = (yield this.knex('time_entries').where('id', timeid))[0];
    if (!time) this.throw(404, errorObjectNotFound('time entry'));
    this.body = time;
}));


var port = process.env.TIMESYNC_PORT || 3000;
app.listen(port);
