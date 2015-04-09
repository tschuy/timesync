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

app.use(_.get('/users/:userid', function *(userid) {
    this.body = yield this.knex('users').where('id', userid);
}));

app.use(_.get('/users', function *() {
    this.body = yield this.knex('users');
}));

app.use(_.post('/users/add', function *() {
    var id = (yield this.knex('users').insert({username: this.request.query['username']}))[0];
    this.body = {
      profile: yield this.knex('users').where('id', id)
    };
}));

app.use(_.post('/activities/add', function *() {
    var slug = this.request.query['slug'];
    if(! slug) {
        slug = this.request.query['name'].toLowerCase()
            .replace(/ /g,'-')
            .replace(/[^\w-]+/g,'')
        ;
    }
    var id = (yield this.knex('activities').insert(
        {name: this.request.query['name'],
        slug: slug}))[0];

    console.log(id);

    this.body = {
      profile: yield this.knex('activities').where('id', id)
    };
}));



app.listen(3000);
