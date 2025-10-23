"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class SettingModel extends Model {
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
}

export const SettingFactory = (sequelize: Sequelize) => {
  SettingModel.init(
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
    },
    {
      sequelize,
      modelName: "Setting",
      tableName: "settings",
    }
  );

  return SettingModel;
};
