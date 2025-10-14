import { compare, hash } from "bcrypt-ts";
import jwt from "jsonwebtoken";

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
		console.log(error);
		return null;
	}
};

export const user_id_test = 1;
