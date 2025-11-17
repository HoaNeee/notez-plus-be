import { Request, Response, NextFunction } from "express";
import { isProduction, log_action, verifyJWT } from "../../../utils/utils";
import { Folder, User } from "../models";
import ApiError from "../../../utils/api-error";

export interface MyRequest extends Request {
	user_id: number;
	workspace_role?: "admin" | "member" | "none";
	is_access_folder?: boolean;
	is_access_folder_action: boolean;
	note_permission?: "view" | "edit" | "comment" | "admin" | "none";
}

export const isAccess = async (
	req: MyRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		req.user_id = 0;

		const exist = await decodedToken(req);

		if (exist instanceof ApiError) {
			throw exist;
		}

		req.user_id = exist.id;
	} catch (error) {
		log_action("Unauthorized access attempt detected.", "warning");
	}

	next();
};

export const requireAuth = async (
	req: MyRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const exist = await decodedToken(req);

		if (exist instanceof ApiError) {
			throw exist;
		}

		req.user_id = exist.id;

		next();
	} catch (error) {
		if (!isProduction) {
			console.log(error);
		}
		res.clearCookie("note_jwt_token", {
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax",
		});
		res.statusMessage = "Unauthorized";
		res.status(401).json({ success: false, message: "Unauthorized" });
	}
};

const decodedToken = async (req: MyRequest) => {
	try {
		let token = req.cookies["note_jwt_token"];

		if (req.headers.authorization) {
			token = token || req.headers.authorization.split(" ")[1];
		}

		if (!token) {
			throw new ApiError(400, "No token provided");
		}

		const decoded = verifyJWT(token);

		if (decoded instanceof ApiError) {
			throw decoded;
		}

		const exist = await User.findOne({
			where: { id: decoded.id, email: decoded.email, status: "active" },
		});

		if (!exist) {
			throw new ApiError(401, "Unauthorized");
		}

		return exist;
	} catch (error) {
		if (error instanceof ApiError) {
			return error;
		}
		return new ApiError(500, "Internal server error");
	}
};
