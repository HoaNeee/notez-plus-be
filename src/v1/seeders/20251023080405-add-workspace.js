"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		/**
		 * Add seed commands here.
		 *
		 * Example:
		 * await queryInterface.bulkInsert('People', [{
		 *   name: 'John Doe',
		 *   isBetaMember: false
		 * }], {});
		 */
		await queryInterface.bulkInsert(
			"workspaces",
			[
				{
					id: 1,
					owner_id: 1,
					title: "Personal Workspace",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					owner_id: 1,
					title: "Work Workspace",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					owner_id: 2,
					title: "Work Workspace 2",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					owner_id: 3,
					title: "Work Workspace 3",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			{}
		);
	},

	async down(queryInterface, Sequelize) {
		/**
		 * Add commands to revert seed here.
		 *
		 * Example:
		 * await queryInterface.bulkDelete('People', null, {});
		 */
		await queryInterface.bulkDelete("workspaces", null, {});
	},
};
