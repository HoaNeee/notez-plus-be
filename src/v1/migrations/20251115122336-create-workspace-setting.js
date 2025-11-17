"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("workspace_settings", {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			workspace_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				references: {
					model: "workspaces",
					key: "id",
				},
			},
			is_profile: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			is_hover_card: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			is_allow_access_from_non_members: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			is_allow_members_invite_guests: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},

			is_allow_members_adding_guests: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			is_allow_members_adding_other_members: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			is_allow_any_user_request_to_added: {
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
		await queryInterface.sequelize.query(
			"DROP TABLE IF EXISTS workspace_settings CASCADE;"
		);
	},
};
