import ApiError from "../../../utils/api-error";
import { MyRequest } from "../middlewares/auth.middleware";
import { Response } from "express";
import { RoleInWorkspace } from "../models/workspace";
import { Folder, Note, NoteLog, sequelize } from "../models";
import { QueryTypes } from "sequelize";
import {
  deleteFolderUtils,
  deleteNoteUtils,
  getRootFolderPrivateHelper,
} from "./utils/utils";
import { NoteLogRefAction } from "../models/notelogs";
import { defaultMessageError } from "../../../utils/contants";

export const getTrashNotes = async (req: MyRequest, res: Response) => {
  const workspace_id = req.params.workspace_id;
  const workspace_role = req.workspace_role;
  let folder_ids_string = req.query.folder_ids as string | undefined;
  const search = req.query.search as string | undefined;

  let folder_ids: number[] = [];

  if (folder_ids_string) {
    folder_ids = folder_ids_string.split(",").map((id) => Number(id));
  }

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
    WHERE w.id = :workspace_id AND n.deleted = true ${
      folder_ids.length ? `AND f.id IN (:folder_ids)` : ""
    } ${search ? `AND n.title LIKE :search` : ``}
  `;

  const notes = await sequelize.query(query, {
    replacements: { workspace_id, folder_ids, search: `%${search}%` },
    type: QueryTypes.SELECT,
  });

  const data = notes.map((note) => {
    return {
      ...note,
      type: "note",
    };
  });

  res.status(200).json({
    message: "Get trash notes success",
    success: true,
    data: { notes: data },
  });
};

export const getTrashFolders = async (req: MyRequest, res: Response) => {
  const workspace_id = Number(req.params.workspace_id || 0);
  const workspace_role = req.workspace_role;
  let parent_ids_string = req.query.parent_ids as string | undefined;
  const search = req.query.search as string | undefined;

  let parent_ids: number[] = [];

  if (parent_ids_string) {
    parent_ids = parent_ids_string.split(",").map((id) => Number(id));
  }

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
    SELECT f.* FROM folders f
    JOIN workspaces w ON w.id = f.workspace_id
    WHERE w.id = :workspace_id AND f.deleted = true ${
      parent_ids.length ? `AND f.parent_id IN (:parent_ids)` : ""
    } ${search ? `AND f.title LIKE :search` : ``}
  `;

  const folders = await sequelize.query(query, {
    replacements: { workspace_id, parent_ids, search: `%${search}%` },
    type: QueryTypes.SELECT,
  });

  const data = folders.map((f) => {
    return {
      ...f,
      type: "folder",
    };
  });

  res.status(200).json({
    message: "Get trash folders success",
    success: true,
    data: { folders: data },
  });
};

export const restoreItem = async (req: MyRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const type = req.params.type as "folder" | "note";

    const ref_id = req.params.ref_id;
    const workspace_role = req.workspace_role;
    const user_id = req.user_id;
    const workspace_id = Number(req.query.workspace_id || 0);

    const rootFolder = await getRootFolderPrivateHelper(user_id, workspace_id);

    if (rootFolder instanceof ApiError) {
      throw new ApiError(500);
    }

    if (workspace_role === RoleInWorkspace.NONE) {
      throw new ApiError(403);
    }

    let data = null;

    if (type === "folder") {
      await Folder.update(
        {
          deleted: false,
          deletedAt: null,
          parent_id: rootFolder.id,
        },
        {
          where: {
            id: ref_id,
          },
          transaction: t,
        }
      );
      data = await Folder.findByPk(ref_id);
      data = {
        ...data,
        parent_id: rootFolder.id,
        type: "folder",
        children: [],
      };
    } else if (type === "note") {
      await Promise.all([
        Note.update(
          {
            deleted: false,
            folder_id: rootFolder.id,
          },
          {
            where: {
              id: ref_id,
            },
            transaction: t,
          }
        ),
        NoteLog.create(
          {
            note_id: ref_id,
            ref_action: NoteLogRefAction.DELETE,
            ref_action_by: user_id || 0,
          },
          { transaction: t }
        ),
      ]);
      data = await Note.findByPk(ref_id);
      data = {
        ...data,
        folder_id: rootFolder.id,
        type: "note",
      };
    }
    await t.commit();

    res.status(200).json({
      status: 200,
      success: true,
      message: `Restore ${type} success`,
      data: data,
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || error || defaultMessageError,
    });
  }
};

export const destroyItem = async (req: MyRequest, res: Response) => {
  const type = req.params.type as "folder" | "note";

  const ref_id = Number(req.params.ref_id || 0);
  const workspace_role = req.workspace_role;

  if (workspace_role === RoleInWorkspace.NONE) {
    throw new ApiError(403);
  }

  if (type === "folder") {
    await deleteFolderUtils({ folder_id: ref_id, is_forever: true });
  } else if (type === "note") {
    await deleteNoteUtils({ note_id: ref_id, is_forever: true });
  }

  res.status(200).json({
    status: 200,
    success: true,
    message: `Delete (destroy) ${type} success`,
  });
};
