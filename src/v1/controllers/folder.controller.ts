import { NextFunction, Request, Response } from "express";
import { Folder, sequelize } from "../models";
import ApiError from "../../../utils/api-error";
import { MyRequest } from "../middlewares/auth.middleware";
import { QueryTypes } from "sequelize";
import { FolderModel } from "../models/folder";
import { findExistFolder } from "../../../helpers/folder";
import {
  createRootFolderAndNoteDefaultForUser,
  getRootFolderHelper,
} from "./utils/utils";

export const getRootFolder = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;

  const root = await getRootFolderHelper(user_id);

  if (root instanceof ApiError) {
    throw root;
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get root folder success",
    data: root,
  });
};

export const getFolders = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;

  const root = await getRootFolderHelper(user_id);

  if (root instanceof ApiError) {
    throw root;
  }

  const folders = await findAllFolder(root.id, user_id);

  if (folders instanceof Error || folders instanceof ApiError) {
    throw folders;
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get list folder success",
    data: { folders },
  });
};

export const getFolderDetail = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;

  const folder_id = req.params.folder_id;

  const folder = await findExistFolder(Number(folder_id), user_id);

  if (folder instanceof ApiError) {
    throw folder;
  }

  const childs = await findAllFolder(folder.id, user_id);

  if (childs instanceof Error || childs instanceof ApiError) {
    throw childs;
  }

  res.status(200).json({
    success: true,
    message: "Get detail folder success",
    status: 200,
    data: { folder, folders: childs },
  });
};

export const createNewFolder = async (req: MyRequest, res: Response) => {
  const body = req.body;
  const parent_id = body.parent_id;
  const user_id = req.user_id;

  const exist = await findExistFolder(parent_id, user_id);
  if (exist instanceof ApiError) {
    throw exist;
  }
  if (exist.deleted) {
    throw new ApiError(400, "Folder was be deleted");
  }

  const folder = await Folder.create({
    ...body,
    user_id,
    parent_id,
  });

  res.status(201).json({
    success: true,
    status: 201,
    message: "Created new folder success",
    data: folder,
  });
};

export const updateFolder = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;
  const folder_id = req.params.folder_id;
  if (!folder_id) {
    throw new ApiError(400);
  }

  const body = req.body;
  const parent_id = body.parent_id;

  const exist = await findExistFolder(Number(folder_id), user_id);
  if (exist instanceof ApiError) {
    throw exist;
  }

  if (parent_id !== exist.parent_id) {
    const existParent = await findExistFolder(Number(parent_id), user_id);
    if (existParent instanceof ApiError) {
      throw existParent;
    }

    if (existParent.deleted) {
      throw new ApiError(400, "Folder was be deleted");
    }

    if (existParent.parent_id !== null) {
      const canUpdate = await canUpdateParent(exist, existParent, user_id);
      if (canUpdate instanceof ApiError) {
        return canUpdate;
      }
      if (!canUpdate) {
        throw new ApiError(400, "Not allowed update");
      }
    }
  }

  await Folder.update(body, {
    where: {
      id: folder_id,
      user_id: user_id,
    },
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "updated folder success",
  });
};

export const deleteFolder = async (req: MyRequest, res: Response) => {
  const folder_id = req.params.folder_id;
  const user_id = req.user_id;
  const isForever = req.query.isForever;

  const exist = await findExistFolder(Number(folder_id), user_id);
  if (exist instanceof ApiError) {
    throw exist;
  }

  if (exist.deleted && !isForever) {
    throw new ApiError(400, "Folder was be removed");
  }

  const t = await sequelize.transaction();
  try {
    let error = null;
    async function deleteChild(isForever: boolean, id: number) {
      try {
        if (error) {
          return error;
        }
        const promises = [];
        const childs = await Folder.findAll({
          where: {
            parent_id: id,
            user_id: user_id,
          },
        });

        childs.forEach(async (child) => {
          if (isForever) {
            promises.push(
              Folder.destroy({
                where: {
                  id: child.id,
                  user_id,
                },
                transaction: t,
              })
            );
          } else {
            promises.push(
              Folder.update(
                { deleted: true, deletedAt: new Date() },
                { where: { id: child.id, user_id: user_id }, transaction: t }
              )
            );
          }
          promises.push(deleteChild(isForever, child.id));
        });

        await Promise.all(promises);
        return true;
      } catch (err) {
        error = err;
        return err;
      }
    }

    if (isForever) {
      await Folder.destroy({
        where: { id: folder_id, user_id: user_id },
        transaction: t,
      });
    } else {
      await Folder.update(
        {
          deleted: true,
          deletedAt: new Date(),
        },
        { where: { id: folder_id, user_id }, transaction: t }
      );
    }

    const bind = await deleteChild(!!isForever, Number(folder_id));
    if (bind instanceof Error) {
      throw bind;
    }

    t.commit();

    res.status(200).json({
      success: true,
      status: 200,
      message: "Deleted folder success",
    });
  } catch (error: any) {
    t.rollback();
    res.status(500).json({
      success: false,
      status: 500,
      message: error.name || "Internal server error",
    });
  }
};

export const createRootFolderAndNoteDefault = async (
  req: MyRequest,
  res: Response
) => {
  const user_id = req.user_id;

  const workspace_id = 1;

  const data = await createRootFolderAndNoteDefaultForUser(
    user_id,
    workspace_id
  );

  if (data instanceof ApiError) {
    throw data;
  }

  const { rootFolder, note } = data;

  res.status(201).json({
    success: true,
    status: 201,
    message: "Created root folder and default note success",
    data: { folder: rootFolder, note },
  });
};

const findAllFolder = async (
  parent_id: number,
  user_id: number
): Promise<FolderModel[] | ApiError> => {
  try {
    const query = `	
		SELECT f1.*, COUNT(f2.id) as count_child, COUNT(n.id) AS count_child_note FROM folders f1
		LEFT JOIN folders f2 ON f2.parent_id = f1.id AND f2.deleted = false
		LEFT JOIN notes n ON n.folder_id = f1.id
		WHERE f1.deleted = false AND f1.user_id = ${user_id} AND f1.parent_id ${
      parent_id === null ? "IS NULL" : `= ${parent_id}`
    }
		GROUP BY f1.id
		`;

    const folders = (await sequelize.query(query, {
      type: QueryTypes.SELECT,
    })) as FolderModel[];

    if (folders.some((f) => f.user_id !== user_id)) {
      throw new ApiError(403);
    }

    return folders;
  } catch (error) {
    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

async function canUpdateParent(
  current_folder: FolderModel,
  next_folder: FolderModel,
  user_id: number
) {
  let error = null;

  async function Find(folder: FolderModel) {
    if (error) {
      return error;
    }

    if (folder.parent_id === current_folder.id) {
      return true;
    }

    const parent = await findExistFolder(folder.parent_id, user_id);
    if (parent instanceof ApiError) {
      error = parent;
      return parent;
    }

    if (parent.parent_id !== null) {
      const find = await Find(parent);
      if (find) {
        return true;
      }
    }
    return false;
  }

  const res = await Find(next_folder);

  if (error) {
    return error;
  }

  if (res) {
    return false;
  }
  return true;
}
