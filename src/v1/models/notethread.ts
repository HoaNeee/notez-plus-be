"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class NoteThread extends Model {
	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	static associate(models) {
		// define association here
	}
	public id!: number | string;
	public note_id!: number;
	public ref_author_id!: number;
	public quote!: string;
	public deleted!: boolean;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
}

export const NoteThreadFactory = (sequelize: Sequelize) => {
	NoteThread.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			ref_author_id: {
				type: DataTypes.INTEGER,
				allowNull: true,
			},
			note_id: {
				type: DataTypes.INTEGER,
				references: { model: "notes", key: "id" },
			},
			quote: {
				type: DataTypes.TEXT("long"),
				allowNull: false,
			},
			deleted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			sequelize,
			modelName: "NoteThread",
			tableName: "note_threads",
		}
	);

	return NoteThread;
};

// model/index.ts
