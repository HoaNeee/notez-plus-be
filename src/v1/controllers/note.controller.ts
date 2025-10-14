import { Response } from "express";
import { Note, sequelize } from "../models";
import { MyRequest } from "../middlewares/auth.middleware";
import { findExistFolder } from "../../../helpers/folder";
import ApiError from "../../../utils/api-error";
import slugify from "slugify";

export const getNotes = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;

	const root_folder_id = req.root_folder_id;

	const folder_id = Number(req.query.folder_id) || root_folder_id;

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

export const createNewNote = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;
	const body = req.body;

	const folder_id = Number(body.folder_id);

	const existFolder = await findExistFolder(Number(folder_id), user_id);
	if (existFolder instanceof ApiError) {
		throw existFolder;
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
	const folder_id = body.folder_id;

	const existNote = await findExistNote(note_id, user_id);
	if (existNote instanceof ApiError) {
		throw existNote;
	}

	if (folder_id && existNote.folder_id !== Number(folder_id)) {
		const existFolder = await findExistFolder(Number(folder_id), user_id);
		if (existFolder instanceof ApiError) {
			throw existFolder;
		}
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
		data: body,
	});
};

export const deleteNote = async (req: MyRequest, res: Response) => {
	const user_id = req.user_id;

	const note_id = Number(req.params.note_id);

	const existNote = await findExistNote(note_id, user_id);
	if (existNote instanceof ApiError) {
		throw existNote;
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
	const user_id = req.user_id;

	const note_slug = req.params.note_slug;

	const existNote = await Note.findOne({
		where: {
			slug: note_slug,
			user_id,
		},
	});

	if (!existNote) {
		throw new ApiError(404, "Note not found");
	}

	let folder_id = existNote.folder_id;
	const root_folder_id = req.root_folder_id;

	const folders = [];

	if (folder_id === root_folder_id) {
		res.status(200).json({
			success: true,
			status: 200,
			message: "Get note detail success",
			data: { note: existNote, folders },
		});
		return;
	}

	const findFolder = async (folder_id: number) => {
		try {
			const existFolder = await findExistFolder(folder_id, user_id);
			if (existFolder instanceof ApiError) {
				throw existFolder;
			}
			if (existFolder.parent_id !== root_folder_id) {
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

	// console.log(folders);

	res.status(200).json({
		success: true,
		status: 200,
		message: "Get note detail success",
		data: { note: existNote, folders },
	});
};

const findExistNote = async (id: number, user_id: number) => {
	try {
		const exist = await Note.findByPk(id, {});
		if (!exist) {
			return new ApiError(404, "Note not found");
		}

		if (exist.user_id !== user_id) {
			return new ApiError(403);
		}
		return exist;
	} catch (error) {
		return new ApiError(500, error.message || "Internal server error");
	}
};
