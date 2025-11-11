import { Response } from "express";
import { MyRequest } from "../middlewares/auth.middleware";
import { Note, sequelize, Workspace } from "../models";
import { Op, QueryTypes } from "sequelize";
import { RequestModel } from "../models/requestmodel";
import { RequestTarget } from "../models/requesttarget";
import { UserModel } from "../models/user";
import ApiError from "../../../utils/api-error";

export const getAllRequests = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const workspace_id = req.query.workspace_id || 0;

	if (!workspace_id) {
		throw new ApiError(400, "workspace_id is required");
	}

	const query = `
    SELECT req.*, rt.* FROM requests req
    JOIN request_targets rt ON rt.request_id = req.id
    WHERE req.workspace_id = ?
  `;

	const requests = (await sequelize.query(
		{
			query,
			values: [workspace_id],
		},
		{ type: QueryTypes.SELECT }
	)) as (RequestModel & RequestTarget)[];

	const set_user_ids = new Set<number>([
		...requests.map((r: RequestModel) => r.sender_id),
		...requests.map((r: RequestModel) => r.receiver_id),
	]);

	if (!set_user_ids.size) {
		res.status(200).json({
			success: true,
			status: 200,
			message: "Get all requests",
			data: { requests: [] },
		});
		return;
	}

	const note_ids = requests
		.filter((r) => r.ref_type === "note")
		.map((r) => r.ref_id);
	const workspace_ids = requests
		.filter((r) => r.ref_type === "workspace")
		.map((r) => r.ref_id);

	let notes = [],
		workspaces = [];
	if (note_ids.length) {
		notes = await Note.findAll({
			where: {
				id: { [Op.in]: note_ids },
			},

			attributes: ["id", "title"],
		});
	}

	if (workspace_ids.length) {
		workspaces = await Workspace.findAll({
			where: {
				id: { [Op.in]: workspace_ids },
			},
			attributes: ["id", "title"],
		});
	}

	const user_ids = Array.from(set_user_ids);

	const users = (await sequelize.query(
		`
	    SELECT id, fullname, email, avatar FROM users
	    WHERE id IN (:user_ids)
	  `,
		{ replacements: { user_ids }, type: QueryTypes.SELECT }
	)) as UserModel[];

	for (const item of requests) {
		const sender_info = users.find((u) => u.id === item.sender_id);
		const receiver_info = users.find((u) => u.id === item.receiver_id);

		if (!sender_info || !receiver_info) continue;

		item["sender_info"] = sender_info;
		item["receiver_info"] = receiver_info;

		if (user_id === item.sender_id) {
			item["type_action"] = "send";
		} else if (user_id === item.receiver_id) {
			item["type_action"] = "receive";
		} else {
			item["type_action"] = "other";
		}

		let ref_data_info = null;
		if (item.ref_type === "note") {
			ref_data_info = notes.find((n) => n.id === item.ref_id);
		} else if (item.ref_type === "workspace") {
			ref_data_info = workspaces.find((w) => w.id === item.ref_id);
		}

		item["ref_data_info"] = ref_data_info;
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get all requests",
		data: { requests },
	});
};

export const updateRequestStatus = async (req: MyRequest, res: Response) => {
	const request_id = req.params.request_id;
	const status = req.body.status;
	const user_id = req.user_id;

	const request = await RequestModel.findOne({
		where: {
			id: request_id,
			status: "pending",
			[Op.or]: [{ sender_id: user_id }, { receiver_id: user_id }],
		},
	});

	if (!request) {
		throw new ApiError(404, "Request not found or already processed");
	}
	request.status = status;

	if (status === "accepted") {
		//handle accept logic here (e.g., add user to note/workspace)
	}

	await request.save();

	res.status(200).json({
		success: true,
		status: 200,
		message: "Request status updated",
		data: { request },
	});
};

const handleAcceptRequest = async (request: RequestModel) => {
	if (!request) return;

	const request_target = await RequestTarget.findOne({
		where: { request_id: request.id },
	});

	if (!request_target) return;

	if (request_target.ref_type === "note") {
		const note_id = request_target.ref_id;
	} else if (request_target.ref_type === "workspace") {
		// Add user to workspace members
	}
};
