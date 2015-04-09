'use strict';

exports.up = function(knex, Promise) {
   return knex.schema.createTable('projects', function (table) {
    table.integer('id').primary();
    table.timestamp('created');
    table.timestamp('modified');
    table.string('name');
    table.string('slug');
    table.string('uri');
    table.string('owner');
  };
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('projects');
};
