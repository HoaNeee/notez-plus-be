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
			"folders",
			[
				{
					id: 1,
					title: "New Folder",
					user_id: 1,
					parent_id: null,
					workspace_id: 1,
					is_in_teamspace: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					title: "New Folder",
					user_id: 1,
					parent_id: 1,
					workspace_id: 1,
					is_in_teamspace: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					title: "New Folder",
					user_id: 1,
					parent_id: 1,
					workspace_id: 1,
					is_in_teamspace: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					title: "Folder A",
					user_id: 1,
					parent_id: 1,
					workspace_id: 1,
					is_in_teamspace: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 5,
					title: "Folder E",
					user_id: 2,
					parent_id: null,
					workspace_id: 3,
					is_in_teamspace: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 6,
					title: "Folder F",
					user_id: 3,
					parent_id: null,
					workspace_id: 4,
					is_in_teamspace: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 7,
					title: "New Teamspace Default",
					user_id: 2,
					parent_id: null,
					workspace_id: 3,
					is_in_teamspace: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 8,
					title: "New Folder in workspace",
					user_id: 1,
					parent_id: null,
					workspace_id: 3,
					is_in_teamspace: false,
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
		await queryInterface.bulkDelete("folders", null, {});
	},
};
