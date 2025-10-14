"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class FolderModel extends Model {
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
	public parent_id!: number;
	public title!: string;
	public deleted!: boolean;
	public deletedAt!: string;
}

export const FolderFactory = (sequelize: Sequelize) => {
	FolderModel.init(
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
			parent_id: {
				type: DataTypes.INTEGER,
			},
			title: {
				type: DataTypes.STRING(255),
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
			modelName: "Folder",
			tableName: "folders",
		}
	);
	return FolderModel;
};

// model/index.ts
