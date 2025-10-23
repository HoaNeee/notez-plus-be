"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("workspaces", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      owner_id: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
      },
      title: {
        type: Sequelize.STRING(255),
      },
      icon_url: {
        type: Sequelize.STRING(500),
      },
      icon_id: {
        type: Sequelize.STRING(500),
      },
      deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        defaultValue: null,
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
    await queryInterface.dropTable("workspaces");
  },
};
