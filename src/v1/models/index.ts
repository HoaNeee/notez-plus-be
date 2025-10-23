import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

import config from "../config/config.json";
import { UserFactory } from "./user";
import { FolderFactory } from "./folder";
import { NoteFactory } from "./note";
import { SettingFactory } from "./setting";
import { EditorSettingFactory } from "./editorsetting";
import { NotificationSettingFactory } from "./notificationsetting";
import { WorkspaceFactory } from "./workspace";
import { WorkspaceDetailFactory } from "./workspacedetail";
import { RequestFactory } from "./requestmodel";
import { RequestTargetFactory } from "./requesttarget";
import { NotePermissionFactory } from "./notepermission";
const env = process.env.NODE_ENV || "development";

export const sequelize = new Sequelize({
  host: config[env].host,
  database: config[env].database,
  username: config[env].username,
  dialect: config[env].dialect,
  password: process.env.DB_PASSWORD || config[env].password || "",
  port: Number(config[env].port) || 3306,
  query: {
    raw: true,
    logging: false,
  },
});

const User = UserFactory(sequelize);
const Folder = FolderFactory(sequelize);
const Note = NoteFactory(sequelize);
const Setting = SettingFactory(sequelize);
const EditorSetting = EditorSettingFactory(sequelize);
const NotificationSetting = NotificationSettingFactory(sequelize);
const Workspace = WorkspaceFactory(sequelize);
const WorkspaceDetail = WorkspaceDetailFactory(sequelize);
const RequestModel = RequestFactory(sequelize);
const RequestTarget = RequestTargetFactory(sequelize);
const NotePermission = NotePermissionFactory(sequelize);

export {
  User,
  Folder,
  Note,
  Setting,
  EditorSetting,
  NotificationSetting,
  Workspace,
  WorkspaceDetail,
  RequestModel,
  RequestTarget,
  NotePermission,
};
