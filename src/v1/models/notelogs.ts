"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export enum NoteLogRefAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  RESTORE = "restore",
}

export class NoteLogModel extends Model {
  /**
   * Helper method for defining associations.
   * This method is not a part of Sequelize lifecycle.
   * The `models/index` file will call this method automatically.
   */
  static associate(models) {
    // define association here
  }
  public id!: number;
  public note_id!: number;
  public ref_action!: NoteLogRefAction;
  public ref_action_by!: number; //user id who did the action
  public ref_extra_data!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const NoteLogsFactory = (sequelize: Sequelize) => {
  NoteLogModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      note_id: {
        type: DataTypes.INTEGER,
        references: { model: "notes", key: "id" },
      },
      ref_action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      ref_action_by: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
      },
      ref_extra_data: {
        type: DataTypes.TEXT("long"),
      },
    },
    {
      sequelize,
      modelName: "NoteLog",
      tableName: "note_logs",
    }
  );

  return NoteLogModel;
};
