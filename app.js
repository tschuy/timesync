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

app.use(_.get('/:userid', function *(userid) {
    this.body = {
      profile: yield this.knex('users').where('id', userid)
    };
}));

app.use(_.post('/add/user', function *() {
    this.body = {
      profile: yield this.knex('users').insert({username: this.request.query['username']})
    };
}));



app.listen(3000);
