"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class NotificationSettingModel extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
  public id!: number;
  public setting_id!: number;
  public is_activity!: boolean;
  public is_email!: boolean;
  public is_page_update!: boolean;
  public is_workspace!: boolean;
}

export const NotificationSettingFactory = (sequelize: Sequelize) => {
  NotificationSettingModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      setting_id: {
        type: DataTypes.INTEGER,
        references: { model: "settings", key: "id" },
      },
      is_activity: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_page_update: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_workspace: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "NotificationSetting",
      tableName: "notification_settings",
    }
  );

  return NotificationSettingModel;
};

// model/index.ts
