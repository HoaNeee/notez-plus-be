import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

import config from "../config/config.json";
import { UserFactory } from "./user";
import { FolderFactory } from "./folder";
import { NoteFactory } from "./note";
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

export { User, Folder, Note };
