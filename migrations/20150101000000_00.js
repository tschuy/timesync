'use strict';

exports.up = function(knex, Promise) {
   return knex.schema.createTable('projects', function (table) {
    table.increments('id').primary();
    table.string('name');
    table.string('slug').unique();
    table.string('uri');
    table.integer('owner').references('id').inTable('users');
  }).createTable('time_entries', function (table) {
    table.increments('id').primary();
    table.integer('duration');
    table.integer('user').references('id').inTable('users');
    table.integer('project').references('id').inTable('projects');
    table.integer('activity').references('id').inTable('activity');
    table.string('notes');
    table.string('issue_uri');
    table.timestamp('date_worked');
    table.timestamps();
  }).createTable('activities', function (table) {
    table.increments('id').primary();
    table.string('name');
    table.string('slug').unique();
  }).createTable('users', function (table) {
    table.increments('id').primary();
    table.string('username').unique();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('projects');
};
