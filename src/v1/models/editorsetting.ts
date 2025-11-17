"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class EditorSettingModel extends Model {
	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	static associate(models) {
		// define association here
	}
	public id!: number;
	public setting_id!: number;
	public fontStyle!: string;
	public tabSize!: string;
	public is_auto_save!: boolean;
	public is_code_highlighting!: boolean;
	public is_auto_wrap_code!: boolean;
}

export const EditorSettingFactory = (sequelize: Sequelize) => {
	EditorSettingModel.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			setting_id: {
				type: DataTypes.INTEGER,
				references: { model: "settings", key: "id" },
			},
			fontStyle: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			tabSize: {
				type: DataTypes.ENUM("2", "4", "6", "8"),
				defaultValue: "4",
			},
			is_code_highlighting: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			is_auto_wrap_code: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			is_auto_save: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
			},
		},
		{
			sequelize,
			modelName: "EditorSetting",
			tableName: "editor_settings",
		}
	);

	return EditorSettingModel;
};
