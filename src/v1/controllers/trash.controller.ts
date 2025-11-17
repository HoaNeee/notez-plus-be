import ApiError from "../../../utils/api-error";
import { MyRequest } from "../middlewares/auth.middleware";
import { Response } from "express";
import { RoleInWorkspace } from "../models/workspace";
import { sequelize } from "../models";
import { QueryTypes } from "sequelize";

export const getTrashNotes = async (req: MyRequest, res: Response) => {
	const workspace_id = req.params.workspace_id;
	const workspace_role = req.workspace_role;

	if (!workspace_id || !workspace_role) {
		throw new ApiError(400, "Invalid workspace access");
	}

	if (workspace_role === RoleInWorkspace.NONE) {
		throw new ApiError(
			403,
			"You do not have permission to access this workspace"
		);
	}

	const query = `
    SELECT n.* FROM notes n
    JOIN folders f ON f.id = n.folder_id
    JOIN workspaces w ON w.id = f.workspace_id
    WHERE w.id = :workspace_id AND n.deleted = true
  `;

	const notes = await sequelize.query(query, {
		replacements: { workspace_id },
		type: QueryTypes.SELECT,
	});

	res
		.status(200)
		.json({
			message: "Get trash notes success",
			success: true,
			data: { notes },
		});
};
