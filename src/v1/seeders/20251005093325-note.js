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

		const content = `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"The editor is a demo environment.","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`;

		await queryInterface.bulkInsert(
			"notes",
			[
				{
					id: 1,
					title: "Note A",
					user_id: 1,
					folder_id: 1,
					content,
					slug: "Note-A-1",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					title: "Note B",
					user_id: 1,
					folder_id: 2,
					content,
					slug: "Note-B-2",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					title: "Note V",
					user_id: 2,
					folder_id: 1,
					content,
					slug: "Note-V-3",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 4,
					title: "Note D",
					user_id: 1,
					folder_id: 1,
					content,
					slug: "Note-D-4",
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
		await queryInterface.bulkDelete("notes", null, {});
	},
};
