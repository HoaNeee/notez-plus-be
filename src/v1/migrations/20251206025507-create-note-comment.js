"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("note_comments", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			author: {
				type: Sequelize.STRING(255),
				allowNull: true,
			},
			ref_author_id: {
				type: Sequelize.INTEGER,
				allowNull: true,
			},
			content: {
				type: Sequelize.TEXT("long"),
				allowNull: true,
			},
			note_thread_id: {
				type: Sequelize.INTEGER,
				references: { model: "note_threads", key: "id" },
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
		await queryInterface.dropTable("note_comments");
	},
};
