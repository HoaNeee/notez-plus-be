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
		//1,3,4
		await queryInterface.bulkInsert(
			"workspace_settings",
			[
				{
					id: 1,
					workspace_id: 1,
					is_profile: false,
					is_hover_card: false,
					is_allow_access_from_non_members: false,
					is_allow_members_invite_guests: false,
					is_allow_members_adding_guests: false,
					is_allow_members_adding_other_members: false,
					is_allow_any_user_request_to_added: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					workspace_id: 3,
					is_profile: false,
					is_hover_card: false,
					is_allow_access_from_non_members: false,
					is_allow_members_invite_guests: false,
					is_allow_members_adding_guests: false,
					is_allow_members_adding_other_members: false,
					is_allow_any_user_request_to_added: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 3,
					workspace_id: 4,
					is_profile: false,
					is_hover_card: false,
					is_allow_access_from_non_members: false,
					is_allow_members_invite_guests: false,
					is_allow_members_adding_guests: false,
					is_allow_members_adding_other_members: false,
					is_allow_any_user_request_to_added: false,
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
		await queryInterface.bulkDelete("workspace_settings", null, {});
	},
};
