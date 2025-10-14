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
		 *
		 */

		await queryInterface.bulkInsert(
			"users",
			[
				{
					id: 1,
					fullname: "nguyen van a",
					email: "nguyenvana@gmail.com",
					password: "123456",
					provider: "account",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					fullname: "le van c",
					email: "levanc@gmail.com",
					password: "123456",
					provider: "account",
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
		await queryInterface.bulkDelete("users", null, {});
	},
};
