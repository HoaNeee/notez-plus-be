"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("editor_settings", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      setting_id: {
        type: Sequelize.INTEGER,
        references: { model: "settings", key: "id" },
      },
      fontStyle: {
        type: Sequelize.STRING(100),
        defaultValue: "Tahoma",
      },
      tabSize: {
        type: Sequelize.ENUM("2", "4", "6", "8"),
        defaultValue: "4",
      },
      is_auto_save: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_code_highlighting: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_auto_wrap_code: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
    await queryInterface.dropTable("editor_settings");
  },
};
