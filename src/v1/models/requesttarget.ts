"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export enum RequestRefType {
	NOTE = "note",
	WORKSPACE = "workspace",
}

export class RequestTarget extends Model {
	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	static associate(models) {
		// define association here
	}
	public id!: number;
	public request_id!: number;
	public ref_type!: string; // e.g., "note", "workspace"
	public ref_id!: number;
	public ref_extra!: string; // eg: {role: "admin"} as JSON string
	public ref_link!: string; // link to access the target directly
	public message!: string;
}

export const RequestTargetFactory = (sequelize: Sequelize) => {
	RequestTarget.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			request_id: {
				type: DataTypes.INTEGER,
				references: { model: "requests", key: "id" },
			},
			ref_type: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			ref_id: {
				type: DataTypes.INTEGER,
				allowNull: false,
			},
			ref_extra: {
				type: DataTypes.TEXT("long"),
				allowNull: true,
			},
			ref_link: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			message: {
				type: DataTypes.TEXT("long"),
			},
		},
		{
			sequelize,
			modelName: "RequestTarget",
			tableName: "request_targets",
		}
	);

	return RequestTarget;
};
