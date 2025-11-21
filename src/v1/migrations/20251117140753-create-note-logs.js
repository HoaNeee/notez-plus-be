"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("note_logs", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      note_id: {
        type: Sequelize.INTEGER,
        references: { model: "notes", key: "id" },
      },
      ref_action: {
        type: Sequelize.STRING(50),
      },
      ref_action_by: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
      },
      ref_extra_data: {
        type: Sequelize.TEXT("long"),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "DROP TABLE IF EXISTS note_logs CASCADE;"
    );
  },
};
