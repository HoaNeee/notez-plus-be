"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("users", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			fullname: {
				type: Sequelize.STRING(255),
			},
			email: {
				type: Sequelize.STRING(50),
				unique: true,
				allowNull: false,
			},
			password: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			provider: {
				type: Sequelize.STRING(50),
				defaultValue: "account",
			},
			avatar: {
				type: Sequelize.STRING(500),
			},
			avatar_id: {
				type: Sequelize.STRING(500),
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
		await queryInterface.dropTable("users");
	},
};
