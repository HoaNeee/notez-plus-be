"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.addColumn("notes", "deleted", {
			type: Sequelize.BOOLEAN,
			defaultValue: false,
		});
		await queryInterface.addColumn("notes", "deletedAt", {
			type: Sequelize.DATE,
			defaultValue: null,
		});
	},

	async down(queryInterface, Sequelize) {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
		await queryInterface.removeColumn("notes", "deleted");
		await queryInterface.removeColumn("notes", "deletedAt");
	},
};
