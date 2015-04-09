'use strict';

exports.up = function(knex, Promise) {
   return knex.schema.createTable('projects', function (table) {
    table.integer('id').primary();
    table.string('name');
    table.string('slug');
    table.string('uri');
    table.integer('owner').references('id').inTable('users');
  }).createTable('time_entries', function (table) {
    table.integer('duration');
    table.integer('users').references('id').inTable('users');
    table.integer('project').references('id').inTable('projects');
    table.integer('activity').references('id').inTable('activity');
    table.string('notes');
    table.string('issue_uri');
    table.timestamp('date_worked');
    table.timestamps();
  }).createTable('activities', function (table) {
    table.integer('id').primary();
    table.string('name');
    table.string('slug');
  }).createTable('users', function (table) {
    table.increments('id');
    table.string('user_name');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('projects');
};
