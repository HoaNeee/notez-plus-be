import { Response, NextFunction } from "express";
import { MyRequest } from "./auth.middleware";
import { log_action } from "../../../utils/utils";
import { findExistMemberInWorkspace } from "../controllers/utils/utils";
import ApiError from "../../../utils/api-error";

export const isAccessibleWorkspace = async (
	req: MyRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const workspace_id = Number(
			req.params.workspace_id ||
				req.query.workspace_id ||
				req.body.workspace_id ||
				0
		);

		const user_id = req.user_id;

		if (!workspace_id) {
			throw new Error("Workspace ID is required");
		}

		const existMember = await findExistMemberInWorkspace(workspace_id, user_id);

		if (existMember instanceof ApiError) {
			throw existMember;
		}

		req.workspace_role = existMember.role;

		next();
	} catch (error) {
		log_action(error);
		res.status(error.statusCode || 500).json({
			message: error.message || "Internal server error",
		});
	}
};
