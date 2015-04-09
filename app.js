var koa = require('koa')
, _ = require('koa-route')
, knex = require('koa-knex');
var app = koa();

app.use(knex({
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  })
)

// strip non-alphanumeric, non-hyphens
function createSlugFrom(name) {
    return name.toLowerCase()
            .replace(/ /g,'-')
            .replace(/[^\w-]+/g,'')
        ;
}

// Users
app.use(_.get('/users/:userid', function *(userid) {
    this.body = (yield this.knex('users').where('id', userid))[0];
}));

app.use(_.get('/users', function *() {
    this.body = yield this.knex('users');
}));

app.use(_.post('/users/add', function *() {
    var id = (yield this.knex('users').insert({username: this.request.query['username']}))[0];
    this.body = yield this.knex('users').where('id', id);
}));

// Projects
app.use(_.get('/projects', function *() {
    this.body = yield this.knex('projects');
}));

app.use(_.post('/projects/add', function *() {
    var slug = this.request.query['slug'];
    if(! slug) {
        slug = createSlugFrom(this.request.query['name']);
    }
    owner_id = (yield this.knex('users').where('username', this.request.query['owner']))[0].id;
    var id = (yield this.knex('projects').insert(
        {name: this.request.query['name'],
         slug: slug,
         uri: this.request.query['uri'],
         owner: owner_id}))[0];

    this.body = yield this.knex('projects').where('id', id);
}));

app.use(_.get('/projects/:projectid', function *(projectid) {
    this.body = (yield this.knex('projects').where('id', projectid))[0];
}));

// Activities
app.use(_.get('/activities', function *() {
    this.body = yield this.knex('activities');
}));

app.use(_.post('/activities/add', function *() {
    var slug = this.request.query['slug'];
    if(! slug) {
        // strip non-alphanumeric, non-hyphens
        slug = createSlugFrom(this.request.query['name']);
    }
    var id = (yield this.knex('activities').insert(
        {name: this.request.query['name'],
        slug: slug}))[0];

    this.body = yield this.knex('activities').where('id', id);
}));

app.use(_.get('/activities/:activityid', function *(activityid) {
    this.body = (yield this.knex('activities').where('id', activityid))[0];
}));

// Time events
app.use(_.get('/time', function *() {
    this.body = yield this.knex('time_entries');
}));

app.use(_.post('/time/add', function *() {
    var activity = this.request.query['activity']; // activity slug
    var project = this.request.query['project']; // project slug
    var user = this.request.query['user']; // username

    var activity_id = null;
    if(activity) {
        // TODO: fuzzy matching
        activity_id = (yield this.knex('activities').where('slug', activity))[0].id;
    }
    project_id = (yield this.knex('projects').where('slug', project))[0].id;
    user_id = (yield this.knex('users').where('username', user))[0].id;
    duration = this.request.query['duration'] * 60; // convert duration from minutes to seconds

    var id = (yield this.knex('time_entries').insert({
        duration: duration,
        user: user_id,
        project: project_id,
        activity: activity_id,
        notes: this.request.query['notes'],
        issue_uri: this.request.query['issue_uri'],
        date_worked: Date.parse(this.request.query['date']),
        created_at: Date.now()
    }))[0];

    this.body = yield this.knex('time_entries').where('id', id);
}));

app.use(_.get('/time/:timeid', function *(timeid) {
    this.body = (yield this.knex('time_entries').where('id', timeid))[0];
}));



app.listen(3000);
