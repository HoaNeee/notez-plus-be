"use strict";

import { DataTypes, Model, Sequelize } from "sequelize";

export class FavoriteNote extends Model {
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
  public workspace_id!: number;
  public notes!: string; //note IDs in JSON string format
}

export const FavoriteNoteFactory = (sequelize: Sequelize) => {
  FavoriteNote.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      workspace_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "workspaces",
          key: "id",
        },
      },
      notes: {
        type: DataTypes.TEXT("long"),
      },
    },
    {
      sequelize,
      modelName: "FavoriteNote",
      tableName: "favorite_notes",
    }
  );

  return FavoriteNote;
};
