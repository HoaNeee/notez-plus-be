import { Request, Response } from "express";
import {
	EditorSetting,
	NotificationSetting,
	sequelize,
	Setting,
	User,
} from "../models";
import ApiError from "../../../utils/api-error";
import {
	hashPasswordUsingBcrypt,
	isProduction,
	signJWT,
	verifyPassword,
} from "../../../utils/utils";
import { MyRequest } from "../middlewares/auth.middleware";

const setCookie = (res: Response, token: string) => {
	res.cookie("note_jwt_token", token, {
		httpOnly: true,
		secure: isProduction,
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
};

export const login = async (req: Request, res: Response) => {
	const body = req.body;

	const email = body.email as string;
	const password = body.password as string;

	const user = await User.findOne({ where: { email, status: "active" } });

	if (!user) {
		throw new ApiError(400, "Invalid email or password");
	}

	const isCompare = await verifyPassword(password, user.password);

	if (!isCompare) {
		throw new ApiError(400, "Invalid email or password");
	}

	delete user.password;
	const token = signJWT(
		{
			id: user.id,
			email: user.email,
		},
		7 * 24 * 60 * 60
	);

	setCookie(res, token);

	res
		.status(200)
		.json({ success: true, message: "Login successful", data: user });
};

export const register = async (req: Request, res: Response) => {
	const t = await sequelize.transaction();
	try {
		const body = req.body;

		const password = body.password as string;
		const email = body.email as string;

		const exist = await User.findOne({ where: { email, status: "active" } });

		if (exist) {
			throw new ApiError(400, "Email already exists");
		}

		const { hashPass } = await hashPasswordUsingBcrypt(password);

		const fullname = email.split("@")[0];

		const user = await User.create(
			{
				email,
				password: hashPass,
				fullname,
				status: "active",
			},
			{ transaction: t }
		);

		const setting = await Setting.create(
			{
				user_id: user.id,
			},
			{ transaction: t }
		);
		await Promise.all([
			EditorSetting.create(
				{
					setting_id: setting.id,
				},
				{ transaction: t }
			),
			NotificationSetting.create(
				{
					setting_id: setting.id,
				},
				{ transaction: t }
			),
		]);

		const data = user.dataValues;
		delete data.password;

		const token = signJWT(
			{
				id: data.id,
				email: data.email,
			},
			7 * 24 * 60 * 60
		);

		setCookie(res, token);

		await t.commit();

		res
			.status(200)
			.json({ success: true, message: "Register successful", data });
	} catch (error) {
		await t.rollback();
		throw new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error"
		);
	}
};

export const checkEmailExist = async (req: Request, res: Response) => {
	const email = req.body.email as string;

	const user = await User.findOne({ where: { email, status: "active" } });

	let exist = false;
	if (user) {
		exist = true;
	}

	res
		.status(200)
		.json({ success: true, message: "Email checked success", exist });
};

export const verifyCode = async (req: Request, res: Response) => {
	const body = req.body;

	const email = body.email as string;
	const code = body.code as string;

	if (code !== "123456") {
		throw new ApiError(400, "Invalid verification code");
	}

	console.log(email, code);

	res.status(200).json({ success: true, message: "Verification code success" });
};

export const resendCode = async (req: Request, res: Response) => {
	const body = req.body;

	const email = body.email as string;

	res.status(200).json({ success: true, message: "Resend code success" });
};

export const logout = async (req: Request, res: Response) => {
	res.clearCookie("note_jwt_token", {
		httpOnly: true,
		secure: isProduction,
		sameSite: "lax",
	});
	res.status(200).json({ success: true, message: "Logout successful" });
};

export const getCurrentUser = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;

	const user = await User.findOne({
		where: { id: user_id, status: "active" },
		attributes: { exclude: ["password"] },
	});

	if (!user) {
		throw new ApiError(404, "User not found");
	}

	res
		.status(200)
		.json({ success: true, message: "Get current user success", data: user });
};

export const getPublicUser = async (req: MyRequest, res: Response) => {
	const email = req.query.email as string;

	if (!email) {
		throw new ApiError(400, "Email is required");
	}

	const user = await User.findOne({
		where: { email, status: "active" },
		attributes: ["email", "fullname", "avatar"],
	});

	if (!user) {
		res.status(200).json({
			success: true,
			message: "User not found",
			data: null,
		});
		return;
	}

	res
		.status(200)
		.json({ success: true, message: "Get public user success", data: user });
};

export const updateProfile = async (req: MyRequest, res: Response) => {
	const body = req.body;

	const user_id = req.user_id;

	const user = await User.findOne({ where: { id: user_id, status: "active" } });

	if (!user) {
		throw new ApiError(404, "User not found");
	}

	await User.update(
		{
			...body,
		},
		{ where: { id: user_id } }
	);

	res.status(200).json({ success: true, message: "Update user success" });
};
