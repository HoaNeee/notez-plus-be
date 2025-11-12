import { Response, NextFunction } from "express";
import { MyRequest } from "./auth.middleware";
import { log_action } from "../../../utils/utils";
import { Note, NotePermission } from "../models";
import ApiError from "../../../utils/api-error";
import {
	findExistFolder,
	findExistMemberInWorkspace,
} from "../controllers/utils/utils";

export const isAccessNote = async (
	req: MyRequest,
	res: Response,
	next: NextFunction
) => {
	try {
		const user_id = req.user_id;
		const note_id = Number(
			req.params.note_id || req.query.note_id || req.body.note_id || 0
		);
		if (!note_id) {
			throw new ApiError(400, "Note ID is required");
		}

		const note = await Note.findOne({ where: { id: note_id, deleted: false } });
		if (!note) {
			throw new ApiError(404, "Note not found");
		}

		if (note.user_id === user_id) {
			req.note_permission = "admin";
			next();
			return;
		}

		if (note.status === "public") {
			req.note_permission = note.status_permission;
		}

		if (note.status === "private") {
			req.note_permission = "none";
		}

		if (note.status === "shared") {
			const sharedPermission = await NotePermission.findOne({
				where: {
					note_id: note.id,
					user_id: user_id,
				},
			});

			if (sharedPermission) {
				req.note_permission = sharedPermission.permission;
			} else {
				req.note_permission = "none";
			}
		}

		if (note.status === "workspace") {
			const folder = await findExistFolder(note.folder_id, user_id);
			if (!(folder instanceof ApiError)) {
				const existMember = await findExistMemberInWorkspace(
					folder.workspace_id,
					user_id
				);

				if (!(existMember instanceof ApiError)) {
					req.note_permission = note.status_permission;
				}
			}
		}
		next();
	} catch (error) {
		log_action(error);
		res.status(error.statusCode || 500).json({
			message: error.message || "Internal server error",
		});
	}
};
