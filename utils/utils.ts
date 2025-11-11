import { compare, hash } from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Folder, Note, sequelize } from "../src/v1/models";
import { startingNoteContent } from "./contants";
import ApiError from "./api-error";
dotenv.config();

export const isProduction = process.env.NODE_ENV === "production";

export const hashPasswordUsingBcrypt = async (password: string) => {
	const salt = 10;

	const hashPass = await hash(password, salt);
	return { salt, hashPass };
};

export const verifyPassword = async (
	password: string,
	hash_password: string
) => {
	return await compare(password, hash_password);
};

export const signJWT = (payload: object, expires?: number) => {
	const secret = process.env.JWT_SECRET || "My-secret";
	const token = jwt.sign(
		payload,
		secret,
		expires ? { expiresIn: expires } : undefined
	);
	return token;
};

export const verifyJWT = (token: string) => {
	const secret = process.env.JWT_SECRET || "My-secret";
	try {
		const decoded = jwt.verify(token, secret);
		return decoded as {
			id: number;
			email: string;
			iat: number;
			exp: number;
		};
	} catch (error) {
		return new ApiError(
			401,
			error instanceof Error ? error.message : "Invalid token"
		);
	}
};

export const log_action = (...args: any[]) => {
	if (!isProduction) {
		console.log(...args);
	}
};

export const user_id_test = 1;
