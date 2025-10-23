"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class WorkspaceDetailModel extends Model {
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
  public member_id!: number;
  public role!: "admin" | "member";
}

export const WorkspaceDetailFactory = (sequelize: Sequelize) => {
  WorkspaceDetailModel.init(
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
      member_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
      },
      role: {
        type: DataTypes.ENUM("admin", "member"),
        defaultValue: "member",
      },
    },
    {
      sequelize,
      modelName: "WorkspaceDetail",
      tableName: "workspace_details",
    }
  );

  return WorkspaceDetailModel;
};
