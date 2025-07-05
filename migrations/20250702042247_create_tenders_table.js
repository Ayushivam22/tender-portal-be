/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("tenders", (table) => {
        table.increments("id").primary();
        table
            .integer("company_id")
            .unsigned()
            .references("id")
            .inTable("companies")
            .onDelete("CASCADE");
        table.string("title").notNullable();
        table.text("description");
        table.date("deadline").notNullable();
        table.decimal("budget");
        table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable("tenders");
};
