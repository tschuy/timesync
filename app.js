var koa = require('koa')
, route = require('koa-route')
, knex = require('koa-knex');
var app = koa();

app.use(knex({
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  })
)

app.use(route.get('/:userid', function *(userid) {
    this.body = {
      profile: yield this.knex('users').where('id', userid)
    };
}));



app.listen(3000);
