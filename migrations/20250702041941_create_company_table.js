/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('companies', table => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').unique();
      table.string('name').notNullable();
      table.string('industry');
      table.text('description');
      table.text('logo_url');
      table.timestamps(true, true);
    });
  };
  


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('companies');
  };
  
