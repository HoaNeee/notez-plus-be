"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

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
  public sender_id!: number;
  public receiver_id!: number;
  public request_type!: string;
  public status!: "pending" | "accepted" | "rejected";
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
      sender_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
      },
      receiver_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
      },
      request_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "accepted", "rejected"),
        defaultValue: "pending",
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
