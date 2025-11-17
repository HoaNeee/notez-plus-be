"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export enum RoleInWorkspace {
	ADMIN = "admin",
	MEMBER = "member",
	NONE = "none",
}

export class WorkspaceModel extends Model {
	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	static associate(models) {
		// define association here
	}
	public id!: number;
	public owner_id!: number;
	public title!: string;
	public icon_url!: string;
	public icon_id!: number;
	public deleted!: boolean;
	public deletedAt!: string;
}

export const WorkspaceFactory = (sequelize: Sequelize) => {
	WorkspaceModel.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			owner_id: {
				type: DataTypes.INTEGER,
				references: { model: "users", key: "id" },
				allowNull: false,
			},
			title: {
				type: DataTypes.STRING(255),
				allowNull: false,
			},
			icon_url: {
				type: DataTypes.STRING(500),
			},
			icon_id: {
				type: DataTypes.INTEGER,
			},
			deleted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			deletedAt: {
				type: DataTypes.DATE,
				defaultValue: null,
			},
		},
		{
			sequelize,
			modelName: "Workspace",
			tableName: "workspaces",
		}
	);

	return WorkspaceModel;
};
