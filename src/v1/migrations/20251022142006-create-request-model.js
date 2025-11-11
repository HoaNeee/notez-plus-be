"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("requests", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			workspace_id: {
				type: Sequelize.INTEGER,
				references: { model: "workspaces", key: "id" },
			},
			sender_id: {
				type: Sequelize.INTEGER,
				references: { model: "users", key: "id" },
				allowNull: false,
			},
			receiver_id: {
				type: Sequelize.INTEGER,
				references: { model: "users", key: "id" },
				allowNull: false,
			},
			request_type: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM("pending", "accepted", "rejected"),
				defaultValue: "pending",
			},
			is_read: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			deleted: {
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
		await queryInterface.dropTable("requests");
	},
};
