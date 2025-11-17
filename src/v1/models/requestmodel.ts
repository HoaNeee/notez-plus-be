"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export enum RequestType {
	REQUEST = "request",
	INVITE = "invite",
	REMOVE = "remove",
}

export class RequestModel extends Model {
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
	public sender_id!: number;
	public receiver_id!: number;
	public request_type!: string;
	public status!: "pending" | "accepted" | "rejected";
	public user_reads!: string;
	public deleted!: boolean;
}

export const RequestFactory = (sequelize: Sequelize) => {
	RequestModel.init(
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
			sender_id: {
				type: DataTypes.INTEGER,
				references: { model: "users", key: "id" },
			},
			receiver_id: {
				type: DataTypes.INTEGER,
				references: { model: "users", key: "id" },
			},
			request_type: {
				type: DataTypes.STRING(50),
				allowNull: false,
			},
			status: {
				type: DataTypes.ENUM("pending", "accepted", "rejected"),
				defaultValue: "pending",
			},
			user_reads: {
				type: DataTypes.TEXT("long"),
				defaultValue: JSON.stringify([]),
			},
			deleted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			sequelize,
			modelName: "RequestModel",
			tableName: "requests",
		}
	);

	return RequestModel;
};
