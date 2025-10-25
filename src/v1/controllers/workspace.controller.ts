import { QueryTypes } from "sequelize";
import { MyRequest } from "../middlewares/auth.middleware";
import { Response } from "express";
import { Folder, sequelize, User, Workspace, WorkspaceDetail } from "../models";
import ApiError from "../../../utils/api-error";
import {
	createWorkspaceForUser,
	findExistMemberInWorkspace,
} from "./utils/utils";

export const getAllWorkspaces = async (req: MyRequest, res: Response) => {
	const owner_id = req.user_id;

	const query = `
    SELECT ws.*, wd.role, COUNT(wd2.id) AS member_count
    FROM workspace_details wd
    JOIN workspaces ws ON ws.id = wd.workspace_id
    LEFT JOIN workspace_details wd2 ON wd2.workspace_id = ws.id
    WHERE wd.member_id = ?
    GROUP BY wd.id, ws.id
    `;

	const workspaces = await sequelize.query(
		{ query: query, values: [owner_id] },
		{ type: QueryTypes.SELECT }
	);

	const query2 = `
  SELECT ws.*, np.permission FROM note_permissions np
  JOIN notes nt ON nt.id = np.note_id
  JOIN folders f ON f.id = nt.folder_id
  JOIN workspaces ws ON ws.id = f.workspace_id
  WHERE np.user_id = ?`;

	const workspaceBeInvited = await sequelize.query(
		{ query: query2, values: [owner_id] },
		{ type: QueryTypes.SELECT }
	);

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get all workspaces success",
		data: { workspaces: workspaces, workspaceBeInvited },
	});
};

export const createNewWorkspace = async (req: MyRequest, res: Response) => {
	const owner_id = req.user_id;

	const body = req.body;

	let defaultTitle = body.title;

	const workspace = await createWorkspaceForUser(owner_id, defaultTitle);

	if (workspace instanceof ApiError) {
		throw workspace;
	}

	res.status(201).json({
		success: true,
		status: 201,
		message: "Create new workspace success",
		data: workspace,
	});
};

export const createDefaultWorkspace = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const workspace = await createWorkspaceForUser(user_id);

	if (workspace instanceof ApiError) {
		throw workspace;
	}

	res.status(201).json({
		success: true,
		status: 201,
		message: "Create default workspace success",
		data: workspace,
	});
};

export const updateWorkspace = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const workspace_id = req.params.workspace_id;
	const body = req.body;

	const workspace = await findExistMemberInWorkspaceWithRole(
		user_id,
		parseInt(workspace_id),
		"admin"
	);

	if (workspace instanceof ApiError) {
		throw workspace;
	}

	await Workspace.update(
		{ ...body },
		{ where: { id: workspace_id }, returning: true }
	);

	const updatedWorkspace = await Workspace.findByPk(workspace_id);

	res.status(200).json({
		success: true,
		status: 200,
		message: "Update workspace success",
		data: updatedWorkspace,
	});
};

export const addNewMemberToWorkspace = async (
	req: MyRequest,
	res: Response
) => {
	const user_id = req.user_id;
	const workspace_id = req.params.workspace_id;
	const body = req.body;
	const member_email = body.member_email;

	const member = await User.findOne({
		where: { email: member_email },
		attributes: {
			exclude: ["password"],
			include: ["id", "email", "fullname", "avatar"],
		},
	});
	if (!member) {
		throw new ApiError(404, "Member not found");
	}

	const existMemberInWorkspace = await WorkspaceDetail.findOne({
		where: {
			workspace_id: Number(workspace_id),
			member_id: member.id,
		},
	});

	if (existMemberInWorkspace) {
		throw new ApiError(409, "Member already exists in workspace");
	}

	const existWorkspace = await findExistMemberInWorkspaceWithRole(
		user_id,
		Number(workspace_id),
		"admin"
	);

	if (existWorkspace instanceof ApiError) {
		throw existWorkspace;
	}

	//maybe need to send invitation email here
	//maybe need to create default folders/notes for the new member here
	const newWorkspaceDetail = await WorkspaceDetail.create({
		workspace_id: Number(workspace_id),
		member_id: member.id,
		role: "admin", // Default role is admin when adding new member
	});

	res.status(200).json({
		success: true,
		status: 200,
		message: "Add new member to workspace success",
		data: { member: member, workspaceDetail: newWorkspaceDetail },
	});
};

export const updateMemberInWorkspace = async (
	req: MyRequest,
	res: Response
) => {
	const user_id = req.user_id;
	const workspace_id = req.params.workspace_id;
	const body = req.body;
	const member_email = body.member_email;

	const member = await User.findOne({
		where: { email: member_email },
		attributes: {
			exclude: ["password"],
			include: ["id", "email", "fullname", "avatar"],
		},
	});
	if (!member) {
		throw new ApiError(404, "Member not found");
	}

	const existMemberInWorkspace = await WorkspaceDetail.findOne({
		where: {
			workspace_id: Number(workspace_id),
			member_id: member.id,
		},
	});

	if (!existMemberInWorkspace) {
		throw new ApiError(409, "Member does not exist in workspace");
	}

	const existWorkspace = await findExistMemberInWorkspaceWithRole(
		user_id,
		Number(workspace_id),
		"admin"
	);

	if (existWorkspace instanceof ApiError) {
		throw existWorkspace;
	}

	await WorkspaceDetail.update(
		{ ...body },
		{ where: { workspace_id: Number(workspace_id), member_id: member.id } }
	);

	res.status(200).json({
		success: true,
		status: 200,
		message: "Update member in workspace success",
		data: { member: member },
	});
};

export const removeMemberFromWorkspace = async (
	req: MyRequest,
	res: Response
) => {
	const user_id = req.user_id;
	const workspace_id = req.params.workspace_id;
	const body = req.body;
	const member_email = body.member_email;

	const member = await User.findOne({
		where: { email: member_email },
		attributes: {
			exclude: ["password"],
			include: ["id", "email", "fullname", "avatar"],
		},
	});
	if (!member) {
		throw new ApiError(404, "Member not found");
	}

	const existMemberInWorkspace = await WorkspaceDetail.findOne({
		where: {
			workspace_id: Number(workspace_id),
			member_id: member.id,
		},
	});

	if (!existMemberInWorkspace) {
		throw new ApiError(409, "Member does not exist in workspace");
	}

	const existWorkspace = await findExistMemberInWorkspaceWithRole(
		user_id,
		Number(workspace_id),
		"admin"
	);

	if (existWorkspace instanceof ApiError) {
		throw existWorkspace;
	}

	//maybe need to check if the member is the last admin before removing
	//maybe need to transfer ownership if the member is the owner
	//maybe need remove all notes/folders of the member in this workspace
	//maybe need to soft delete instead of hard delete
	await WorkspaceDetail.destroy({
		where: { workspace_id: Number(workspace_id), member_id: member.id },
	});

	res.status(200).json({
		success: true,
		status: 200,
		message: "Remove member from workspace success",
		data: { member: member },
	});
};

export const getDetailWorkspace = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const workspace_id = req.params.workspace_id;

	const existWorkspace = await findExistMemberInWorkspaceWithRole(
		user_id,
		parseInt(workspace_id),
		"member"
	);

	if (existWorkspace instanceof ApiError) {
		throw existWorkspace;
	}

	const { workspace } = existWorkspace;

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get workspace detail success",
		data: workspace,
	});
};

export const removeWorkspace = async (req: MyRequest, res: Response) => {
	res.status(200).json({
		success: true,
		status: 200,
		message: "Remove workspace success",
		data: {},
	});
};

const findExistWorkspace = async (workspace_id: number) => {
	try {
		const workspace = await Workspace.findOne({
			where: {
				id: workspace_id,
			},
		});

		if (!workspace) {
			throw new ApiError(404, "Workspace not found");
		}

		return workspace;
	} catch (error) {
		if (error instanceof ApiError) {
			return error;
		}
		return new ApiError(500, "Internal server error");
	}
};

const findExistMemberInWorkspaceWithRole = async (
	user_id: number,
	workspace_id: number,
	role_target: "admin" | "member"
) => {
	try {
		const workspace = await findExistWorkspace(workspace_id);

		if (workspace instanceof ApiError) {
			return workspace;
		}

		const workspaceDetail = await findExistMemberInWorkspace(
			workspace_id,
			user_id
		);

		if (workspaceDetail instanceof ApiError) {
			return workspaceDetail;
		}

		if (workspaceDetail.role === "admin") {
			return { workspace, workspaceDetail };
		}

		if (!workspaceDetail || workspaceDetail.role !== role_target) {
			throw new ApiError(
				403,
				"You do not have permission to access this workspace"
			);
		}

		return { workspace, workspaceDetail };
	} catch (error) {
		if (error instanceof ApiError) {
			return new ApiError(error.statusCode, error.message);
		}
		return new ApiError(500, "Internal server error");
	}
};
