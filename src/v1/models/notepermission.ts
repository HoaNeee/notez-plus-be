"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class NotePermissionModel extends Model {
	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	static associate(models) {
		// define association here
	}
	public id!: number;
	public user_id!: number;
	public note_id!: number;
	// public request_id!: number;
	public permission!: "view" | "edit" | "admin";
}

export const NotePermissionFactory = (sequelize: Sequelize) => {
	NotePermissionModel.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			user_id: {
				type: DataTypes.INTEGER,
				references: { model: "users", key: "id" },
			},
			note_id: {
				type: DataTypes.INTEGER,
				references: { model: "notes", key: "id" },
			},
			// request_id: {
			//   type: DataTypes.INTEGER,
			//   references: { model: "requests", key: "id" },
			// },
			permission: {
				type: DataTypes.ENUM("view", "edit", "admin"),
				defaultValue: "view",
			},
		},
		{
			sequelize,
			modelName: "NotePermission",
			tableName: "note_permissions",
		}
	);

	return NotePermissionModel;
};

// model/index.ts
