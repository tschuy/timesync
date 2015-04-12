TimeSync
========

Sync your time. It's cool, yo!

Quickstart for devs:
-------------------
1. You can run migrations with `npm run migrate`
2. You can nuke the db and rerun migrations with `npm run recreate`
3. You can start the app with `npm start`. The app runs on `localhost:3000`.
4. You can run the linter with `npm run lint`
5. you can test the app with `npm test`, but right now the code to clear the
database and reload the fixtures is broken. The easiest way to fix this is to
recreate the DB between tests
6. We need a spec for the views we want.

Docs you'll want:
-----------------
* http://koajs.com/
* http://knexjs.org/
* https://city41.github.io/node-sql-fixtures/
* http://mochajs.org/
