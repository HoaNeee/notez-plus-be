"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";
import slugify from "slugify";

export class NoteModel extends Model {
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
	public folder_id!: number;
	public title!: string;
	public slug!: string;
	public content!: string;
	public status_permission!: "view" | "edit" | "comment" | "none";
	public deleted!: boolean;
	public deletedAt!: string;
	public status!: "private" | "public" | "workspace" | "shared"; //shared when other user will be invited
}

export const NoteFactory = (sequelize: Sequelize) => {
	NoteModel.init(
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
			folder_id: {
				type: DataTypes.INTEGER,
				references: { model: "folders", key: "id" },
			},
			title: {
				type: DataTypes.STRING(255),
			},
			content: {
				type: DataTypes.TEXT("long"),
			},
			slug: {
				type: DataTypes.STRING(255),
			},
			status: {
				type: DataTypes.ENUM("private", "public", "workspace", "shared"),
				defaultValue: "private",
			},
			status_permission: {
				type: DataTypes.ENUM("view", "edit", "comment", "none"),
				defaultValue: "none",
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
			modelName: "Note",
			tableName: "notes",
		}
	);

	NoteModel.afterCreate(async (note, option) => {
		const slug = slugify(`${note.title || ""}-${note.id}`, {
			lower: true,
			strict: true,
		});

		await NoteModel.update(
			{
				slug: slug,
			},
			{
				where: {
					id: note.id,
				},
				transaction: option.transaction,
			}
		);
	});

	return NoteModel;
};
