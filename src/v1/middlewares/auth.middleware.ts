import { Request, Response, NextFunction } from "express";
import {
	createRootFolderAndNoteDefaultForUser,
	isProduction,
	verifyJWT,
} from "../../../utils/utils";
import { Folder, User } from "../models";

export interface MyRequest extends Request {
	user_id: number;
	root_folder_id: number;
}

export const isAccess = (req: MyRequest, res: Response, next: NextFunction) => {
	req.user_id = 1;
	req.root_folder_id = 1;
	next();
};

export const requireAuth = async (
	req: MyRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		let token = req.cookies["note_jwt_token"];

		if (req.headers.authorization) {
			token = token || req.headers.authorization.split(" ")[1];
		}

		if (!token) {
			throw new Error("No token provided");
		}

		const decoded = verifyJWT(token);

		if (decoded instanceof Error) {
			throw decoded;
		}

		const [exist, rootFolder] = await Promise.all([
			User.findOne({
				where: { id: decoded.id, email: decoded.email, status: "active" },
			}),
			Folder.findOne({
				where: { user_id: decoded.id, parent_id: null, deleted: false },
			}),
		]);

		if (!exist) {
			throw new Error("Unauthorized");
		}
		if (!rootFolder) {
			await createRootFolderAndNoteDefaultForUser(exist.id);
			//maybe create root folder here
		}

		req.user_id = exist.id;
		req.root_folder_id = rootFolder ? rootFolder.id : 1;

		// 		req.user_id = 1;
		// req.root_folder_id = 1;

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
