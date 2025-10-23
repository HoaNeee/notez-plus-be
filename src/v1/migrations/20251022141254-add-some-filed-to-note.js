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
    await queryInterface.addColumn("notes", "public_permission", {
      type: Sequelize.ENUM("view", "edit", "comment", "none"),
      defaultValue: "none",
    });
    await queryInterface.addColumn("notes", "is_shared", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("notes", "public_permission");
    await queryInterface.removeColumn("notes", "is_shared");
  },
};
