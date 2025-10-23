"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notification_settings", {
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
      is_activity: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_email: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_activity: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_page_update: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_workspace: {
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
    await queryInterface.dropTable("notification_settings");
  },
};
