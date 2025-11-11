import { Response } from "express";
import {
	Note,
	NotePermission,
	sequelize,
	User,
	Workspace,
	WorkspaceDetail,
} from "../models";
import { MyRequest } from "../middlewares/auth.middleware";
import {
	checkIsAccessFolder,
	checkIsAccessFolderAction,
	findExistFolder,
	findExistMemberInWorkspaceWithFolderId,
	getRootFolderInTeamspace,
} from "./utils/utils";
import ApiError from "../../../utils/api-error";
import slugify from "slugify";
import { getRootFolderPrivateHelper } from "./utils/utils";
import { NoteModel } from "../models/note";
import { QueryTypes } from "sequelize";

export const getNotesPrivateOrTeamspace = async (
	req: MyRequest,
	res: Response
) => {
	const user_id = req.user_id;
	const workspace_id = Number(req.query.workspace_id || 0);
	let folder_id = Number(req.query.folder_id || 0);

	let is_in_teamspace = false;

	if (!folder_id) {
		const root_folder = await getRootFolderPrivateHelper(user_id, workspace_id);

		if (root_folder instanceof ApiError) {
			throw root_folder;
		}

		const isAccess = await checkIsAccessFolder(root_folder, user_id);
		if (isAccess instanceof ApiError) {
			throw isAccess;
		}
		is_in_teamspace = !!root_folder.is_in_teamspace;

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
		is_in_teamspace = !!existFolder.is_in_teamspace;
	}

	const notes = await Note.findAll({
		where: {
			folder_id: folder_id,
			deleted: false,
		},
	});

	if (notes.length) {
		for (const note of notes) {
			note["is_in_teamspace"] = is_in_teamspace;
		}
	}

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
			res.status(200).json({
				success: true,
				status: 200,
				message: "Get list note success",
				data: null,
			});
			return;
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

	if (notes.length) {
		for (const note of notes) {
			note["is_in_teamspace"] = true;
		}
	}

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
		throw new ApiError(403, "You do not have permission to access");
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
				root_folder = await getRootFolderPrivateHelper(
					user_id,
					folder.workspace_id
				);
			}

			if (root_folder instanceof ApiError) {
				throw root_folder;
			}

			const folders = [];

			if (folder_id === root_folder.id) {
				return folders;
			}

			//just find parent folder so each time just call recursive 1 time -> not bad for performance
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

	const handleCheckPermissionForNote = async () => {
		try {
			let is_guest_in_workspace = false;
			let differentNotesPublished = [];
			let permission = "view";

			const existPermission = await NotePermission.findOne({
				where: {
					note_id: existNote.id,
					user_id: user_id,
				},
			});
			if (existPermission) {
				// can be handle priority permission here
				permission = existPermission.permission;
			} else {
				permission = existNote.status_permission;
			}
			is_guest_in_workspace = true;

			//get different notes published for this user
			const note_ids = await NotePermission.findAll({
				where: {
					user_id: user_id,
				},
				attributes: ["note_id"],
			});

			const ids = note_ids
				.map((n) => n.note_id)
				.filter((id) => id !== existNote.id);

			if (ids.length) {
				const query = `
					SELECT * FROM notes
					WHERE id IN (:note_ids)
					AND status = 'shared'
					AND deleted = false
				`;

				const notes = await sequelize.query(query, {
					type: QueryTypes.SELECT,
					replacements: { note_ids: ids },
				});

				differentNotesPublished = [...notes];
			}

			return { is_guest_in_workspace, differentNotesPublished, permission };
		} catch (error) {
			return new ApiError(500, "Internal server error");
		}
	};

	let permission = "view"; //note
	let role = "member"; //workspace

	//existNote.user_id !== user_id => logged in but not owner
	//!user_id => not logged in
	if (!user_id || existNote.user_id !== user_id) {
		let folders: any[] = [];

		if (!user_id) {
			if (existNote.status !== "public") {
				throw new ApiError(403);
			}
			res.status(200).json({
				success: true,
				status: 200,
				message: "Get note detail success",
				data: { note: existNote, workspace, folder: null },
			});
			return;
		}

		//this case will be check user maybe in workspace or is invited
		//is_shared => invited user
		const existMember = await findExistMemberInWorkspaceWithFolderId(
			existNote.folder_id,
			user_id
		);

		let is_guest = false;
		let differentNotesPublished = [];

		// console.log(existMember);

		//not in workspace -> note just can be is_shared or public
		if (existMember instanceof ApiError) {
			if (existNote.status === "shared" || existNote.status === "public") {
				const result = await handleCheckPermissionForNote();
				if (result instanceof ApiError) {
					throw result;
				}
				const {
					is_guest_in_workspace,
					differentNotesPublished: newDifferentNotesPublished,
					permission: newPermission,
				} = result;
				is_guest = is_guest_in_workspace;
				permission = newPermission;
				differentNotesPublished = newDifferentNotesPublished;
			} else {
				throw new ApiError(403);
			}
		} else {
			if (folder.is_in_teamspace) {
				const data = await getLevelFolderBreadcrumb();
				if (data instanceof ApiError) {
					throw data;
				}
				folders = data;
				role = existMember.role;
				is_guest = false;
			} else if (existNote.status === "private") {
				throw new ApiError(403);
			} else {
				is_guest = true;
				//status is public or shared or workspace
				if (existNote.status === "workspace") {
					permission = existNote.status_permission;
				} else {
					const result = await handleCheckPermissionForNote();
					if (result instanceof ApiError) {
						throw result;
					}
					const {
						differentNotesPublished: newDifferentNotesPublished,
						permission: newPermission,
					} = result;
					permission = newPermission;
					differentNotesPublished = newDifferentNotesPublished;
				}
			}
		}

		res.status(200).json({
			success: true,
			status: 200,
			message: "Get note detail success",
			data: {
				note: {
					...existNote,
					is_in_teamspace: !!folder.is_in_teamspace,
					permission,
					role,
				},
				folder: {
					folder: folder,
					foldersBreadcrumb: folders,
				},
				workspace: {
					...workspace,
					is_guest,
					role,
				},
				differentNotesPublished,
			},
		});

		return;
	}

	role = "admin";
	permission = "admin";

	const folders = await getLevelFolderBreadcrumb();
	if (folders instanceof ApiError) {
		throw folders;
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get note detail success",
		data: {
			note: {
				...existNote,
				is_in_teamspace: !!folder.is_in_teamspace,
				permission,
				role,
			},
			folder: {
				folder: folder,
				foldersBreadcrumb: folders,
			},
			workspace,
			differentNotesPublished: [],
		},
	});
};

export const getDefaultNote = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const workspace_id = Number(req.query.workspace_id || 0);

	const getSomeNoteInWorkspace = async (workspace_id: number) => {
		try {
			const some = await sequelize.query(
				{
					query: `
						SELECT n.* FROM notes n
						JOIN folders f ON n.folder_id = f.id
						WHERE f.workspace_id = ? AND n.deleted = false
						ORDER BY n.updatedAt DESC
						LIMIT 1
					`,
					values: [workspace_id],
				},
				{
					type: QueryTypes.SELECT,
				}
			);

			return some?.[0] || null;
		} catch (error) {
			return new ApiError(500, "Internal server error");
		}
	};

	if (workspace_id) {
		const query = `
			SELECT n.* FROM notes n
			JOIN folders f ON n.folder_id = f.id
			WHERE f.workspace_id = ? AND n.user_id = ? AND n.deleted = false
			ORDER BY n.updatedAt DESC
			LIMIT 1
		`;

		const workspace = await Workspace.findByPk(workspace_id);
		if (!workspace) {
			const defaultWorkspace = await Workspace.findOne({
				where: {
					owner_id: user_id,
					deleted: false,
				},
			});

			if (!defaultWorkspace) {
				//maybe handle create default workspace for user here
				throw new ApiError(
					400,
					"Need create new workspace, user dont have any workspace"
				);
			}

			const notes = await sequelize.query(
				{
					query,
					values: [defaultWorkspace.id, user_id],
				},
				{
					type: QueryTypes.SELECT,
				}
			);

			let note = null;
			if (notes && notes.length > 0) {
				note = notes[0];
			} else {
				const some = await getSomeNoteInWorkspace(defaultWorkspace.id);
				if (some instanceof ApiError) {
					throw some;
				}
				note = some;
			}

			res.status(200).json({
				success: true,
				status: 200,
				message: "Get default note success",
				data: { note: note, workspace: defaultWorkspace },
			});
			return;
		}

		//notes private
		let note = null;
		const notes = await sequelize.query(
			{
				query,
				values: [workspace_id, user_id],
			},
			{
				type: QueryTypes.SELECT,
			}
		);
		if (notes && notes.length > 0) {
			note = notes[0];
		} else {
			const some = await getSomeNoteInWorkspace(workspace_id);

			if (some instanceof ApiError) {
				throw some;
			}
			note = some;
		}

		res.status(200).json({
			success: true,
			status: 200,
			message: "Get default note success",
			data: { note: note, workspace },
		});

		return;
	}

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

	const folder = await findExistFolder(notes[0].folder_id, user_id);
	if (folder instanceof ApiError) {
		throw folder;
	}

	const workspace = await getWorkspaceByFolderId(folder.id, user_id);

	if (workspace instanceof ApiError) {
		throw workspace;
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get default note success",
		data: { note: notes[0], workspace, folder },
	});
};

export const getMembersInNote = async (req: MyRequest, res: Response) => {
	const note_id = Number(req.params.note_id || 0);

	const existNote = await Note.findByPk(note_id);
	if (!existNote) {
		throw new ApiError(404, "Note not found");
	}

	const members = await sequelize.query(
		{
			query: `
			SELECT u.id, u.fullname, u.email, np.permission FROM note_permissions np
			JOIN users u ON np.user_id = u.id
			WHERE np.note_id = ? AND u.id != ?
		`,
			values: [note_id, existNote.user_id],
		},
		{ type: QueryTypes.SELECT }
	);

	const owner = await User.findByPk(existNote.user_id);

	if (owner) {
		members.unshift({
			id: owner.id,
			fullname: owner.fullname,
			email: owner.email,
			permission: "admin",
		});
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get members in note success",
		data: {
			members: members,
		},
	});
};

const findExistNoteAndPermission = async (id: number, user_id: number) => {
	try {
		const exist = await Note.findByPk(id);
		if (!exist) {
			throw new ApiError(404, "Note not found");
		}

		console.log(exist);

		if (exist.user_id === user_id) {
			return { note: exist, permission: "admin", role: "admin" };
		}

		if (exist.status === "shared") {
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

		if (note.user_id === user_id) {
			return true;
		}

		if (note.status === "public" && note.status_permission !== "edit") {
			throw errorAccess;
		} else if (note.status === "shared") {
			if (permission !== "edit" && permission !== "admin") {
				throw errorAccess;
			}
		} else if (note.status === "workspace") {
			//MAYBE NEED FIX LATER
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

		const [workspace, member_count, workspace_details] = await Promise.all([
			Workspace.findByPk(folder.workspace_id),
			WorkspaceDetail.count({
				where: {
					workspace_id: folder.workspace_id,
				},
			}),
			WorkspaceDetail.findOne({
				where: {
					workspace_id: folder.workspace_id,
					member_id: user_id,
				},
			}),
		]);
		if (!workspace) {
			throw new ApiError(404, "Workspace not found");
		}

		return {
			...workspace,
			member_count,
			role: workspace_details ? workspace_details.role : "member",
		};
	} catch (error) {
		return new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error"
		);
	}
};
