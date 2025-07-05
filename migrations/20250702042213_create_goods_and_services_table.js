/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('goods_and_services', table => {
      table.increments('id').primary();
      table.integer('company_id').unsigned().references('id').inTable('companies').onDelete('CASCADE');
      table.string('name').notNullable();
    });
  };
  
 

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('goods_and_services');
  };
  
