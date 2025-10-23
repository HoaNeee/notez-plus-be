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

export const RequestTargetFactory = (sequelize: Sequelize) => {
  RequestModel.init(
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
      message: {
        type: DataTypes.TEXT("long"),
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
