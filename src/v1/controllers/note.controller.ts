import { Response } from "express";
import {
	Note,
	NotePermission,
	RequestModel,
	RequestTarget,
	sequelize,
	User,
	Workspace,
	WorkspaceDetail,
} from "../models";
import { MyRequest } from "../middlewares/auth.middleware";
import {
	checkIsAccessFolder,
	findExistFolder,
	findExistMemberInWorkspace,
	findExistMemberInWorkspaceWithFolderId,
	getRootFolderInTeamspace,
} from "./utils/utils";
import ApiError from "../../../utils/api-error";
import slugify from "slugify";
import { getRootFolderPrivateHelper } from "./utils/utils";
import { NoteModel } from "../models/note";
import { QueryTypes } from "sequelize";
import { log_action } from "../../../utils/utils";
import { RequestType } from "../models/requestmodel";
import { RequestRefType } from "../models/requesttarget";

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

	if (existFolder.is_in_teamspace) {
		const memberInWorkspace = await findExistMemberInWorkspace(
			existFolder.workspace_id,
			user_id
		);

		if (
			memberInWorkspace instanceof ApiError ||
			memberInWorkspace.role !== "admin"
		) {
			throw memberInWorkspace;
		}
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

	const note_id = Number(req.params.note_id || 0);

	const newPermission = req.note_permission || "none";

	if (newPermission !== "edit" && newPermission !== "admin") {
		throw new ApiError(403, "You do not have permission to access this note");
	}

	const existNote = await findExistNoteAndPermission(note_id, user_id);
	if (existNote instanceof ApiError) {
		throw existNote;
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

	const note_id = Number(req.params.note_id || 0);

	const newPermission = req.note_permission || "none";

	if (newPermission !== "edit" && newPermission !== "admin") {
		throw new ApiError(403, "You do not have permission to access this note");
	}

	const existNote = await findExistNoteAndPermission(note_id, user_id);
	if (existNote instanceof ApiError) {
		throw existNote;
	}

	if (existNote.note.status === "public") {
		throw new ApiError(403, "You do not have permission to delete this note");
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

	const handlePermissionForNote = async () => {
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
			} else if (existNote.status === "public") {
				permission = existNote.status_permission;
			} else {
				throw new ApiError(403);
			}
			is_guest_in_workspace = true;

			//get different notes published for this user
			const note_ids = await sequelize.query(
				`
          SELECT np.note_id FROM note_permissions np
          JOIN notes n ON n.id = np.note_id
          JOIN folders f ON f.id = n.folder_id
          JOIN workspaces w ON w.id = f.workspace_id
          WHERE w.id = :w_id AND n.id != :note_id AND np.user_id = :user_id     
          `,
				{
					type: QueryTypes.SELECT,
					replacements: {
						w_id: workspace.id,
						note_id: existNote.id,
						user_id: user_id,
					},
				}
			);

			if (note_ids.length) {
				const ids = note_ids.map((n: any) => n.note_id);
				const query = `
					SELECT * FROM notes
					WHERE id IN (:note_ids)
					AND deleted = false
					AND status = 'shared'
				`;

				const notes = await sequelize.query(query, {
					type: QueryTypes.SELECT,
					replacements: { note_ids: ids },
				});

				differentNotesPublished = [...notes];
			}

			const notesPublic = await sequelize.query(
				`
        SELECT n.* FROM notes n
        JOIN folders f ON n.folder_id = f.id
        JOIN workspaces w ON f.workspace_id = w.id
        WHERE n.status = 'public' AND n.deleted = false AND w.id = :workspace_id AND n.id != :note_id
        `,
				{
					type: QueryTypes.SELECT,
					replacements: { workspace_id: workspace.id, note_id: existNote.id },
				}
			);

			differentNotesPublished = [...differentNotesPublished, ...notesPublic];
			differentNotesPublished.unshift(existNote);

			return { is_guest_in_workspace, differentNotesPublished, permission };
		} catch (error) {
			return new ApiError(
				error.statusCode || 500,
				error.message || "Internal server error"
			);
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

		//not in workspace -> note just can be is_shared or public
		if (existMember instanceof ApiError) {
			if (existNote.status === "shared" || existNote.status === "public") {
				const result = await handlePermissionForNote();
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
					const result = await handlePermissionForNote();
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

export const addMembersToNote = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const note_id = Number(req.params.note_id || 0);

	const note_permission = req.note_permission || "none";
	const body = req.body;
	const emails =
		(body.emails as {
			email: string;
			is_guest: boolean;
			permission: string;
		}[]) || [];
	const message = (body.message as string) || "";
	const workspace_id = Number(body.workspace_id || 0);

	if (note_permission !== "admin") {
		throw new ApiError(403, "You do not have permission to access this note");
	}

	const existNote = await Note.findByPk(note_id);
	if (!existNote) {
		throw new ApiError(404, "Note not found");
	}

	const members = [];
	const t = await sequelize.transaction();
	try {
		await Promise.all(
			emails.map((em) => {
				return (async () => {
					const user = await User.findOne({
						where: {
							email: em.email,
						},
					});
					if (user) {
						const [_, request] = await Promise.all([
							Note.update(
								{
									status: "shared",
								},
								{
									where: {
										id: existNote.id,
									},
								}
							),
							NotePermission.create(
								{
									note_id: existNote.id,
									user_id: user.id,
									permission: em.permission,
								},
								{ transaction: t }
							),
							RequestModel.create(
								{
									workspace_id,
									sender_id: user_id,
									receiver_id: user.id,
									status: "accepted",
									request_type: RequestType.INVITE,
								},
								{ transaction: t }
							),
						]);
						await RequestTarget.create(
							{
								request_id: request.id,
								ref_type: RequestRefType.NOTE,
								ref_id: existNote.id,
								ref_link: `/${existNote.slug}`,
								message,
							},
							{ transaction: t }
						);
						members.push({
							id: user.id,
							fullname: user.fullname,
							email: user.email,
							permission: em.permission,
						});
					}
				})();
			})
		);
		await t.commit();
	} catch (error) {
		await t.rollback();
		log_action(error);
		throw new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error."
		);
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "add members to note success",
		data: {
			members: members,
		},
	});
};

export const updateMemberInNote = async (req: MyRequest, res: Response) => {
	const note_id = Number(req.params.note_id || 0);

	const note_permission = req.note_permission || "none";
	const body = req.body;

	if (note_permission !== "admin") {
		throw new ApiError(403, "You do not have permission to access this note");
	}

	const existNote = await Note.findByPk(note_id);
	if (!existNote) {
		throw new ApiError(404, "Note not found");
	}

	const t = await sequelize.transaction();
	try {
		await NotePermission.update(
			{
				permission: body.permission,
			},
			{
				where: {
					note_id: note_id,
					user_id: body.member_id,
				},
				transaction: t,
			}
		);
		await t.commit();
	} catch (error) {
		await t.rollback();
		log_action(error);
		throw new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error."
		);
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "update member in note success",
	});
};

export const removeMemberFromNote = async (req: MyRequest, res: Response) => {
	const note_id = Number(req.params.note_id || 0);
	const user_id = req.user_id;

	const note_permission = req.note_permission || "none";
	const member_id = Number(req.params.member_id || 0);
	const workspace_id = Number(
		req.query.workspace_id || req.body.workspace_id || 0
	);

	if (note_permission !== "admin") {
		throw new ApiError(403, "You do not have permission to access this note");
	}

	const existNote = await Note.findByPk(note_id);
	if (!existNote) {
		throw new ApiError(404, "Note not found");
	}

	const t = await sequelize.transaction();
	try {
		//just remove permission, because this user do not work in workspace, this action different user invited to workspace
		await Promise.all([
			NotePermission.destroy({
				where: {
					note_id: note_id,
					user_id: member_id,
				},
				transaction: t,
			}),
			RequestModel.create(
				{
					workspace_id,
					sender_id: user_id,
					receiver_id: member_id,
					status: "accepted",
					request_type: RequestType.REMOVE,
				},
				{ transaction: t }
			),
			RequestTarget.create(
				{
					request_id: note_id,
					ref_type: RequestRefType.NOTE,
					ref_id: existNote.id,
					ref_link: `/${existNote.slug}`,
				},
				{ transaction: t }
			),
		]);
		await t.commit();
	} catch (error) {
		await t.rollback();
		log_action(error);
		throw new ApiError(
			error.statusCode || 500,
			error.message || "Internal server error."
		);
	}

	res.status(200).json({
		success: true,
		status: 200,
		message: "remove members from note success",
	});
};

const findExistNoteAndPermission = async (id: number, user_id: number) => {
	try {
		const exist = await Note.findByPk(id);
		if (!exist) {
			throw new ApiError(404, "Note not found");
		}

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
