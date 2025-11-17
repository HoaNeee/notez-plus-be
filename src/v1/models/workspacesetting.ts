"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class WorkspaceSettingModel extends Model {
	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	static associate(models) {
		// define association here
	}
	public id!: number;
	public workspace_id!: number;
	public is_profile!: boolean;
	public is_hover_card!: boolean;
	public is_allow_access_from_non_members!: boolean;
	public is_allow_members_invite_guests!: boolean;
	public is_allow_members_adding_guests!: boolean;
	public is_allow_members_adding_other_members!: boolean;
	public is_allow_any_user_request_to_added!: boolean;
}

export const WorkspaceSettingFactory = (sequelize: Sequelize) => {
	WorkspaceSettingModel.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			workspace_id: {
				type: DataTypes.INTEGER,
				references: { model: "workspaces", key: "id" },
			},
			is_profile: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			is_hover_card: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			is_allow_access_from_non_members: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			is_allow_members_invite_guests: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			is_allow_members_adding_guests: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			is_allow_members_adding_other_members: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			is_allow_any_user_request_to_added: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			sequelize,
			modelName: "WorkspaceSetting",
			tableName: "workspace_settings",
		}
	);

	return WorkspaceSettingModel;
};
