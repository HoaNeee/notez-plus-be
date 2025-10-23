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
    await queryInterface.addColumn("folders", "workspace_id", {
      type: Sequelize.INTEGER,
      references: {
        model: "workspaces",
        key: "id",
      },
    });
    await queryInterface.addColumn("folders", "is_in_teamspace", {
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
    await queryInterface.removeColumn("folders", "workspace_id");
    await queryInterface.removeColumn("folders", "is_in_teamspace");
  },
};
