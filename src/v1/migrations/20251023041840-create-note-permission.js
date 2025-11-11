"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("note_permissions", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			permission: {
				type: Sequelize.ENUM("view", "edit", "admin", "comment"),
				allowNull: false,
				defaultValue: "view",
			},
			note_id: {
				type: Sequelize.INTEGER,
				references: { model: "notes", key: "id" },
				allowNull: false,
			},
			user_id: {
				type: Sequelize.INTEGER,
				references: { model: "users", key: "id" },
				allowNull: false,
			},
			// request_id: {
			//   type: Sequelize.INTEGER,
			//   references: { model: "requests", key: "id" },
			//   allowNull: true,
			// },
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
		await queryInterface.dropTable("note_permissions");
	},
};
