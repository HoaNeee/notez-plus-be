import { Response, NextFunction } from "express";
import { MyRequest } from "./auth.middleware";
import ApiError from "../../../utils/api-error";
import { log_action } from "../../../utils/utils";
import { Folder } from "../models";
import { findExistMemberInWorkspace } from "../controllers/utils/utils";

export const isAccessibleFolder = async (
	req: MyRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const folder_id = Number(
			req.params.folder_id || req.query.folder_id || req.body.folder_id || 0
		);
		const user_id = req.user_id;

		if (!folder_id) {
			throw new ApiError(400, "Folder ID is required");
		}

		const folder = await Folder.findOne({
			where: { id: folder_id, deleted: false },
		});

		if (!folder) {
			throw new ApiError(404, "Folder not found");
		}

		if (folder.user_id === user_id) {
			req.is_access_folder = true;
			req.is_access_folder_action = true;
			next();
			return;
		}

		const existMember = await findExistMemberInWorkspace(
			folder.workspace_id,
			user_id
		);

		if (existMember instanceof ApiError) {
			throw existMember;
		}
		req.is_access_folder = true;
		req.is_access_folder_action = existMember.role === "admin";

		next();
	} catch (error) {
		log_action(error);
		res.status(error.statusCode || 500).json({
			message: error.message || "Internal server error",
		});
	}
};
