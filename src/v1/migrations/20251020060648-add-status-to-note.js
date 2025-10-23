"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("notes", "status", {
      type: Sequelize.ENUM("private", "public", "workspace"),
      defaultValue: "private",
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // await queryInterface.sequelize.query(`
    //     ALTER TABLE notes DROP COLUMN IF EXISTS status;
    //   `);
    await queryInterface.removeColumn("notes", "status");
  },
};
