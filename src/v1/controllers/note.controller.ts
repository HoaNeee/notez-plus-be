import { Response } from "express";
import { Note, NotePermission, sequelize, Workspace } from "../models";
import { MyRequest } from "../middlewares/auth.middleware";
import {
	checkIsAccessFolder,
	checkIsAccessFolderAction,
	findExistFolder,
	findExistMemberInWorkspace,
	findExistMemberInWorkspaceWithFolderId,
	getRootFolderInTeamspace,
} from "./utils/utils";
import ApiError from "../../../utils/api-error";
import slugify from "slugify";
import { getRootFolderHelper } from "./utils/utils";
import { NoteModel } from "../models/note";

export const getNotesPrivate = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const workspace_id = Number(req.query.workspace_id || 0);
	let folder_id = Number(req.query.folder_id || 0);

	if (!folder_id) {
		const root_folder = await getRootFolderHelper(user_id, workspace_id);

		if (root_folder instanceof ApiError) {
			throw root_folder;
		}

		const isAccess = await checkIsAccessFolder(root_folder, user_id);
		if (isAccess instanceof ApiError) {
			throw isAccess;
		}

		folder_id = root_folder.id;
	} else {
		const existFolder = await findExistFolder(folder_id, user_id);
		if (existFolder instanceof ApiError) {
			throw existFolder;
		}
		const isAccess = await checkIsAccessFolder(existFolder, user_id);
		if (isAccess instanceof ApiError) {
			throw isAccess;
		}
	}

	const notes = await Note.findAll({
		where: {
			folder_id: folder_id,
			user_id,
			deleted: false,
		},
	});

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get list note success",
		data: { notes },
	});
};

export const getNotesInTeamspace = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const workspace_id = Number(req.query.workspace_id || 0);

	let folder_id = Number(req.query.folder_id || 0);

	if (folder_id) {
		const existFolder = await findExistFolder(folder_id, user_id);
		if (existFolder instanceof ApiError) {
			throw existFolder;
		}
		const isAccess = await checkIsAccessFolder(existFolder, user_id);
		if (isAccess instanceof ApiError) {
			throw isAccess;
		}
	} else {
		const root_folder = await getRootFolderInTeamspace(user_id, workspace_id);

		if (root_folder instanceof ApiError) {
			throw root_folder;
		}
		const isAccess = await checkIsAccessFolder(root_folder, user_id);
		if (isAccess instanceof ApiError) {
			throw isAccess;
		}
		folder_id = root_folder.id;
	}

	const notes = await Note.findAll({
		where: {
			folder_id: folder_id,
			deleted: false,
		},
	});

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get list note success",
		data: { notes },
	});
};

export const createNewNote = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const body = req.body;

	const folder_id = Number(body.folder_id || 0);

	const existFolder = await findExistFolder(Number(folder_id), user_id);
	if (existFolder instanceof ApiError) {
		throw existFolder;
	}

	const isAccess = await checkIsAccessFolderAction(existFolder, user_id);

	if (isAccess instanceof ApiError) {
		throw new ApiError(403, "You do not have permission to access this folder");
	}

	const note = await Note.create({
		...body,
		user_id,
	});

	const slug = slugify(`${note.title || ""}-${note.id}`, {
		lower: true,
		strict: true,
	});
	note.slug = slug;

	res.status(201).json({
		success: true,
		status: 201,
		message: "Created new page note success",
		data: note,
	});
};

export const updateNote = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const body = req.body;

	const note_id = Number(req.params.note_id);

	const existNote = await findExistNoteAndPermission(note_id, user_id);
	if (existNote instanceof ApiError) {
		throw existNote;
	}

	const { note, permission, role } = existNote;

	const isAccess = await checkIsAccessNoteAction(
		note,
		permission,
		role,
		user_id,
		"update"
	);

	if (isAccess instanceof ApiError) {
		throw isAccess;
	}

	const title = body.title;
	if (title) {
		const slug = slugify(`${title}`, {
			lower: true,
			strict: true,
		});
		body.slug = `${slug}-${note_id}`;
	}

	await Note.update({ ...body }, { where: { id: note_id } });

	res.status(200).json({
		success: true,
		status: 200,
		message: "updated page note success",
		data: {
			id: note_id,
			...body,
		},
	});
};

export const deleteNote = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;

	const note_id = Number(req.params.note_id);

	const existNote = await findExistNoteAndPermission(note_id, user_id);
	if (existNote instanceof ApiError) {
		throw existNote;
	}

	const { note, permission, role } = existNote;

	const isAccess = await checkIsAccessNoteAction(
		note,
		permission,
		role,
		user_id,
		"delete"
	);

	if (isAccess instanceof ApiError) {
		throw isAccess;
	}

	const isForever = req.query.isForever;

	if (isForever) {
		await Note.destroy({ where: { id: note_id } });
	} else {
		await Note.update(
			{ deleted: true, deletedAt: new Date() },
			{ where: { id: note_id } }
		);
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "Deleted note success",
	});
};

export const getDetail = async (req: MyRequest, res: Response) => {
	const note_slug = req.params.note_slug;
	const user_id = req.user_id;

	const existNote = await Note.findOne({
		where: {
			slug: note_slug,
		},
	});

	if (!existNote) {
		throw new ApiError(404, "Note not found");
	}

	const folder = await findExistFolder(existNote.folder_id, user_id);

	if (folder instanceof ApiError) {
		throw folder;
	}

	const workspace = await getWorkspaceByFolderId(folder.id, user_id);

	if (workspace instanceof ApiError) {
		throw workspace;
	}

	const isAccessFolder = await checkIsAccessFolder(folder, user_id);
	if (isAccessFolder instanceof ApiError) {
		throw isAccessFolder;
	}

	//level folder breadcrumb
	const getLevelFolderBreadcrumb = async () => {
		try {
			let folder_id = existNote.folder_id;
			let root_folder = null;

			if (folder.is_in_teamspace) {
				root_folder = await getRootFolderInTeamspace(
					user_id,
					folder.workspace_id
				);
			} else {
				root_folder = await getRootFolderHelper(user_id, folder.workspace_id);
			}

			if (root_folder instanceof ApiError) {
				throw root_folder;
			}

			const folders = [];

			if (folder_id === root_folder.id) {
				return folders;
			}

			const findFolder = async (folder_id: number) => {
				try {
					const existFolder = await findExistFolder(folder_id, user_id);
					if (existFolder instanceof ApiError) {
						throw existFolder;
					}
					if (existFolder.parent_id !== root_folder.id) {
						folders.push(existFolder);
						await findFolder(existFolder.parent_id);
					} else {
						folders.push(existFolder);
					}
				} catch (error) {
					return error;
				}
			};

			const error = await findFolder(folder_id);
			if (error instanceof ApiError) {
				throw error;
			}

			return folders.reverse();
		} catch (error) {
			return new ApiError(
				error.statusCode || 500,
				error.message || "Internal server error"
			);
		}
	};

	if (!user_id || existNote.user_id !== user_id) {
		let folders: any[] = [];

		//not logged in
		if (!user_id) {
			if (existNote.status !== "public") {
				throw new ApiError(403);
			}
			res.status(200).json({
				success: true,
				status: 200,
				message: "Get note detail success",
				data: { note: existNote, workspace },
			});
			return;
		}
		//note was shared (invited)
		if (existNote.is_shared) {
			const permission = await NotePermission.findOne({
				where: {
					note_id: existNote.id,
					user_id: user_id,
				},
			});
			if (!permission) {
				throw new ApiError(403);
			}
		}
		//logged in but not owner
		else if (
			existNote.user_id !== user_id &&
			existNote.status === "workspace"
		) {
			const existMember = await findExistMemberInWorkspaceWithFolderId(
				existNote.folder_id,
				user_id
			);

			if (existMember instanceof ApiError) {
				throw existMember;
			}
			const data = await getLevelFolderBreadcrumb();
			if (data instanceof ApiError) {
				throw data;
			}
			folders = data;
		}

		res.status(200).json({
			success: true,
			status: 200,
			message: "Get note detail success",
			data: {
				note: existNote,
				folder: folder,
				foldersBreadcrumb: folders,
				workspace,
			},
		});

		return;
	}

	const folders = await getLevelFolderBreadcrumb();
	if (folders instanceof ApiError) {
		throw folders;
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get note detail success",
		data: {
			note: existNote,
			folder: folder,
			foldersBreadcrumb: folders,
			workspace,
		},
	});
};

export const getDefaultNote = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;

	const notes = await Note.findAll({
		where: {
			user_id,
			deleted: false,
		},
		limit: 1,
		order: [["updatedAt", "DESC"]],
	});

	if (!notes || notes.length === 0) {
		throw new ApiError(404, "No notes found");
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get default note success",
		data: notes[0],
	});
};

const findExistNoteAndPermission = async (id: number, user_id: number) => {
	try {
		const exist = await Note.findByPk(id);
		if (!exist) {
			throw new ApiError(404, "Note not found");
		}

		if (exist.is_shared) {
			const permission = await NotePermission.findOne({
				where: {
					note_id: id,
					user_id: user_id,
				},
			});
			if (!permission) {
				throw new ApiError(
					403,
					"You do not have permission to access this note"
				);
			}
			return { note: exist, permission: permission.permission };
		}

		if (exist.status === "public") {
			return { note: exist };
		}

		if (exist.status === "workspace") {
			const existMember = await findExistMemberInWorkspaceWithFolderId(
				exist.folder_id,
				user_id
			);
			if (existMember instanceof ApiError) {
				throw existMember;
			}

			return { note: exist, role: existMember.role };
		}

		return { note: exist };
	} catch (error) {
		return new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error"
		);
	}
};

const checkIsAccessNoteAction = async (
	note: NoteModel,
	permission: string,
	role: string,
	user_id: number,
	action: "update" | "delete"
) => {
	try {
		const errorAccess = new ApiError(
			403,
			"You do not have permission to access this note"
		);

		if (action === "delete") {
			if (note.status === "public") {
				throw errorAccess;
			}
		}

		if (note.status === "public" && note.status_permission !== "edit") {
			throw errorAccess;
		} else if (note.is_shared) {
			if (permission !== "edit" && permission !== "admin") {
				throw errorAccess;
			}
		} else if (note.status === "workspace") {
			if (role !== "admin") {
				throw errorAccess;
			}
		} //not owner and not is access on above -> in teamspace
		else if (note.user_id !== user_id) {
			const existFolder = await findExistFolder(note.folder_id, user_id);
			if (existFolder instanceof ApiError) {
				throw existFolder;
			}
			if (!existFolder.is_in_teamspace) {
				throw new ApiError(
					403,
					"You do not have permission to access this note"
				);
			}

			const isAccessFolder = await checkIsAccessFolderAction(
				existFolder,
				user_id
			);

			if (isAccessFolder instanceof ApiError) {
				throw isAccessFolder;
			}
		}
	} catch (error) {
		return new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error"
		);
	}
};

const getWorkspaceByFolderId = async (folder_id: number, user_id: number) => {
	try {
		const folder = await findExistFolder(folder_id, user_id);
		if (folder instanceof ApiError) {
			throw folder;
		}

		const workspace = await Workspace.findByPk(folder.workspace_id);
		if (!workspace) {
			throw new ApiError(404, "Workspace not found");
		}

		return workspace;
	} catch (error) {
		return new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error"
		);
	}
};
