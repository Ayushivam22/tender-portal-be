/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable("applications", (table) => {
        table.increments("id").primary();
        table
            .integer("tender_id")
            .unsigned()
            .references("id")
            .inTable("tenders")
            .onDelete("CASCADE");
        table
            .integer("company_id")
            .unsigned()
            .references("id")
            .inTable("companies")
            .onDelete("CASCADE");
        table.text("proposal");
        table.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable("applications");
};
