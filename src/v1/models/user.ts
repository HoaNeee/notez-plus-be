"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class UserModel extends Model {
	/**
	 * Helper method for defining associations.
	 * This method is not a part of Sequelize lifecycle.
	 * The `models/index` file will call this method automatically.
	 */
	static associate(models) {
		// define association here
	}
	public id!: number;
	public fullname!: string;
	public email!: string;
	public pasword!: string;
	public provider!: string;
	public avatar!: string;
	public avatar_id!: number;
}

export const UserFactory = (sequelize: Sequelize) => {
	UserModel.init(
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			fullname: {
				type: DataTypes.STRING(255),
			},
			email: {
				type: DataTypes.STRING(50),
				unique: true,
				allowNull: false,
			},
			password: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
			provider: {
				type: DataTypes.STRING(50),
				defaultValue: "account",
			},
			avatar: {
				type: DataTypes.STRING(500),
			},
			avatar_id: {
				type: DataTypes.STRING(500),
			},
		},
		{
			sequelize,
			modelName: "User",
			tableName: "users",
		}
	);
	return UserModel;
};

// model/index.ts
