"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class NoteCommentModel extends Model {
	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	static associate(models) {
		// define association here
	}
	public id!: number | string;
	public note_thread_id!: number;
	public author!: string;
	public ref_author_id!: number;
	public content!: string;
	public deleted!: boolean;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

export const NoteCommentFactory = (sequelize: Sequelize) => {
	NoteCommentModel.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			author: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			ref_author_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			content: {
				type: DataTypes.TEXT("long"),
				allowNull: true,
			},
			deleted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
			note_thread_id: {
				type: DataTypes.INTEGER,
				references: { model: "note_threads", key: "id" },
			},
		},
		{
			sequelize,
			modelName: "NoteComment",
			tableName: "note_comments",
		}
	);

	return NoteCommentModel;
};

// model/index.ts
