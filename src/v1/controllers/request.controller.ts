import { Response } from "express";
import { MyRequest } from "../middlewares/auth.middleware";
import { Folder, Note, NotePermission, sequelize, Workspace } from "../models";
import { Op, QueryTypes } from "sequelize";
import { RequestModel, RequestType } from "../models/requestmodel";
import { RequestRefType, RequestTarget } from "../models/requesttarget";
import { UserModel } from "../models/user";
import ApiError from "../../../utils/api-error";
import { addNewMemberToNote } from "./utils/utils";

enum RequestTypeAction {
	SEND = "send",
	RECEIVE = "receive",
	OTHER = "other",
}

export const getAllRequestsInWorkspace = async (
	req: MyRequest,
	res: Response
) => {
	const user_id = req.user_id;
	const workspace_id = req.query.workspace_id || 0;

	if (!workspace_id) {
		throw new ApiError(400, "workspace_id is required");
	}

	const query = `
    SELECT req.*, rt.* FROM requests req
    JOIN request_targets rt ON rt.request_id = req.id
    WHERE req.workspace_id = :workspace_id AND (rt.ref_status = 'workspace' OR req.sender_id = :user_id OR req.receiver_id = :user_id)
    ORDER BY req.createdAt DESC
  `;

	const requests = (await sequelize.query(query, {
		type: QueryTypes.SELECT,
		replacements: {
			workspace_id,
			user_id,
		},
	})) as (RequestModel & RequestTarget)[];

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

			attributes: ["id", "title", "slug"],
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
			item["type_action"] = RequestTypeAction.SEND;
		} else if (user_id === item.receiver_id) {
			item["type_action"] = RequestTypeAction.RECEIVE;
		} else {
			item["type_action"] = RequestTypeAction.OTHER;
		}

		let ref_data_info = null;
		if (item.ref_type === "note") {
			ref_data_info = notes.find((n) => n.id === item.ref_id);
		} else if (item.ref_type === "workspace") {
			ref_data_info = workspaces.find((w) => w.id === item.ref_id);
		}

		item["ref_data_info"] = ref_data_info;
		item.user_reads = item.user_reads ? JSON.parse(item.user_reads) : [];
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get all requests",
		data: { requests },
	});
};

export const createNewNoteRequest = async (req: MyRequest, res: Response) => {
	const t = await sequelize.transaction();
	try {
		const body = req.body;
		const user_id = req.user_id;
		const workspace_id = Number(req.query.workspace_id || 0);

		const slug = body.note_slug;

		const existNote = await Note.findOne({
			where: {
				slug,
			},
		});

		if (!existNote) {
			throw new ApiError(404, "Note not found");
		}

		const existRequests = await sequelize.query(
			`SELECT req.* FROM requests req
			JOIN request_targets rt ON rt.request_id = req.id
			WHERE req.workspace_id = :workspace_id
			AND req.sender_id = :sender_id
			AND req.receiver_id = :receiver_id
			AND rt.ref_type = :ref_type
			AND rt.ref_id = :ref_id
      AND req.status = 'pending'
      AND req.is_completed = false
			`,
			{
				replacements: {
					workspace_id,
					sender_id: user_id,
					receiver_id: existNote.user_id,
					ref_type: RequestRefType.NOTE,
					ref_id: existNote.id,
				},
				type: QueryTypes.SELECT,
			}
		);

		if (existRequests && existRequests.length > 0) {
			const existRequest = existRequests[0] as RequestModel;
			res.status(200).json({
				success: true,
				message: "Request already exists",
				status: 200,
				data: { request: existRequest, is_exist: true },
			});
			return;
		}

		const request = await RequestModel.create(
			{
				workspace_id,
				sender_id: user_id,
				receiver_id: existNote.user_id,
				request_type: RequestType.REQUEST,
				status: "pending",
			},
			{ transaction: t }
		);

		const payload_request_target = {
			request_id: request.id,
			ref_type: RequestRefType.NOTE,
			ref_id: existNote.id,
			ref_link: `/${existNote.slug}`,
			ref_status: "workspace",
		};

		const existFolder = await Folder.findByPk(existNote.folder_id);

		if (existFolder) {
			if (!existFolder.is_in_teamspace) {
				payload_request_target.ref_status = "private";
			}
		}

		const request_target = await RequestTarget.create(payload_request_target, {
			transaction: t,
		});

		await t.commit();

		res.status(201).json({
			success: true,
			message: "Create new request success",
			status: 201,
			data: {
				request: {
					...request.dataValues,
					...request_target.dataValues,
				},
				is_exist: false,
			},
		});
	} catch (error) {
		await t.rollback();
		throw new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error"
		);
	}
};

export const updateRequestStatus = async (req: MyRequest, res: Response) => {
	const t = await sequelize.transaction();
	try {
		const request_id = req.params.request_id;
		const status = req.body.status;
		const user_id = req.user_id;
		const workspace_id = Number(req.query.workspace_id || 0);

		const request = await RequestModel.findOne({
			where: {
				id: request_id,
				status: "pending",
			},
		});

		if (!request) {
			throw new ApiError(404, "Request not found or already processed");
		}

		if (request.request_type !== RequestType.REQUEST) {
			throw new ApiError(400, "Invalid request type");
		}

		if (request.receiver_id !== user_id) {
			throw new ApiError(
				403,
				"You do not have permission to update this request"
			);
		}

		const requestTarget = await RequestTarget.findOne({
			where: {
				request_id: request.id,
			},
		});
		if (!requestTarget) {
			throw new ApiError(404, "Request target not found");
		}

		if (status === "accepted") {
			if (requestTarget.ref_type === RequestRefType.NOTE) {
				await addNewMemberToNote(
					{
						note_id: requestTarget.ref_id,
						user_id: request.receiver_id,
						permission: "view",
					},
					t
				);
			} else if (requestTarget.ref_type === RequestRefType.WORKSPACE) {
				//add user to workspace members
				//... your logic here
			}
		}

		const newRequest = await RequestModel.create(
			{
				workspace_id,
				sender_id: user_id,
				receiver_id: request.sender_id,
				request_type: RequestType.REQUEST,
				status: status,
			},
			{ transaction: t }
		);
		await RequestTarget.create(
			{
				request_id: newRequest.id,
				ref_type: requestTarget.ref_type,
				ref_id: requestTarget.ref_id,
				ref_link: requestTarget.ref_link,
				ref_status: requestTarget.ref_status,
			},
			{ transaction: t }
		);

		let user_reads_json = request.user_reads;

		const user_reads = request.user_reads;

		if (user_reads) {
			const parse = JSON.parse(user_reads) as number[];
			if (!parse.includes(user_id)) {
				parse.push(user_id);
				user_reads_json = JSON.stringify(parse);
			}
		}

		await RequestModel.update(
			{
				user_reads: user_reads_json,
				is_completed: true,
			},
			{
				where: {
					id: request_id,
				},
				transaction: t,
			}
		);

		await t.commit();

		res.status(200).json({
			success: true,
			status: 200,
			message: "Request status updated",
			data: { request },
		});
	} catch (error) {
		await t.rollback();
		throw new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error"
		);
	}
};

export const markRequestAsRead = async (req: MyRequest, res: Response) => {
	const request_id = req.params.request_id;
	const user_id = req.body.user_id || req.user_id;

	const request = await RequestModel.findOne({
		where: {
			id: request_id,
			[Op.or]: [{ sender_id: user_id }, { receiver_id: user_id }],
		},
	});

	if (!request) {
		throw new ApiError(404, "Request not found");
	}

	const user_reads = [
		...(request.user_reads ? (JSON.parse(request.user_reads) as number[]) : []),
	];

	if (!user_reads.includes(user_id)) {
		user_reads.push(user_id);
	} else {
		res.status(200).json({
			success: true,
			status: 200,
			message: "Request already marked as read",
		});
		return;
	}

	await RequestModel.update(
		{
			user_reads: JSON.stringify(user_reads),
		},
		{
			where: {
				id: request_id,
			},
		}
	);

	res.status(200).json({
		success: true,
		status: 200,
		message: "Request marked as read",
	});
};
