"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("request_targets", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			request_id: {
				type: Sequelize.INTEGER,
				references: { model: "requests", key: "id" },
				allowNull: false,
			},
			ref_type: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			ref_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			ref_extra: {
				type: Sequelize.TEXT("long"),
				allowNull: true,
			},
			ref_link: {
				type: Sequelize.STRING(255),
				allowNull: true,
			},
			message: {
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
		await queryInterface.dropTable("request_targets");
	},
};
