"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("note_threads", {
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
			ref_author_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			quote: {
				type: Sequelize.TEXT("long"),
				allowNull: false,
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
		await queryInterface.dropTable("note_threads");
	},
};
