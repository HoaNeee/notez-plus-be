import { Response } from "express";
import { Folder, Note, sequelize, User, Workspace } from "../models";
import ApiError from "../../../utils/api-error";
import { MyRequest } from "../middlewares/auth.middleware";
import { QueryTypes } from "sequelize";
import { FolderModel } from "../models/folder";
import {
  checkIsAccessFolder,
  findExistFolder,
  findExistMemberInWorkspace,
  getRootFolderInTeamspace,
} from "./utils/utils";
import {
  createRootFolderAndNoteDefaultForUser,
  getRootFolderPrivateHelper,
} from "./utils/utils";
import { isProduction } from "../../../utils/utils";
import { startingNoteContent } from "../../../utils/contants";

export const getRootFolder = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;
  const workspace_id = Number(req.query.workspace_id || 0);

  const rootPrivate = await getRootFolderPrivateHelper(user_id, workspace_id);
  let rootTeamspace = await getRootFolderInTeamspace(user_id, workspace_id);

  if (rootTeamspace instanceof ApiError) {
    rootTeamspace = null;
  }

  if (rootPrivate instanceof ApiError) {
    const code = rootPrivate.statusCode || 500;
    if (code === 403) {
      res.status(200).json({
        success: true,
        status: 200,
        message: "Not access",
        data: { rootFolderPrivate: null, rootFolderTeamspace: null },
      });
      return;
    }
    throw rootPrivate;
  }

  const isAccess = await checkIsAccessFolder(rootPrivate, user_id);
  if (isAccess instanceof ApiError) {
    throw isAccess;
  }

  if (rootTeamspace && !(rootTeamspace instanceof ApiError)) {
    const isAccessTeamspace = await checkIsAccessFolder(rootTeamspace, user_id);
    if (isAccessTeamspace instanceof ApiError) {
      throw isAccessTeamspace;
    }
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get roots folder success",
    data: {
      rootFolderPrivate: rootPrivate,
      rootFolderTeamspace: rootTeamspace,
    },
  });
};

export const getFoldersPrivate = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;
  const workspace_id = Number(req.query.workspace_id || 0);

  const root = await getRootFolderPrivateHelper(user_id, workspace_id);

  if (root instanceof ApiError) {
    throw root;
  }

  const isAccess = await checkIsAccessFolder(root, user_id);

  if (isAccess instanceof ApiError) {
    throw isAccess;
  }

  const folders = await findAllFolderWithParent(root.id, user_id, workspace_id);

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

export const getFoldersInTeamspace = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;
  const workspace_id = Number(req.query.workspace_id || 0);

  //default is 1 -> root folder of teamspace
  const root = await getRootFolderInTeamspace(user_id, workspace_id);

  if (root instanceof ApiError) {
    res.status(200).json({
      success: true,
      status: 200,
      message: "Get list folder in teamspace success",
      data: null,
    });
    return;
  }

  const isAccess = await checkIsAccessFolder(root, user_id);
  if (isAccess instanceof ApiError) {
    throw isAccess;
  }

  const folders = await findAllFolderWithParent(
    root.id,
    root.user_id,
    workspace_id
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get list folder in teamspace success",
    data: { folders: folders },
  });
};

export const getFolderDetail = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;

  const folder_id = Number(req.params.folder_id || 0);
  const is_access = req.is_access_folder;

  if (!is_access) {
    throw new ApiError(403, "Forbidden");
  }

  const folder = await findExistFolder(folder_id, user_id);

  if (folder instanceof ApiError) {
    throw folder;
  }

  const childs = await findAllFolderWithParent(
    folder.id,
    folder.user_id,
    folder.workspace_id
  );

  if (childs instanceof ApiError) {
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
  const workspace_id = Number(req.query.workspace_id || body.workspace_id || 0);

  const exist = await findExistFolder(parent_id, user_id);
  if (exist instanceof ApiError) {
    throw exist;
  }

  if (exist.deleted) {
    throw new ApiError(400, "Parent Folder was deleted");
  }

  if (exist.is_in_teamspace) {
    const role = req.workspace_role;
    if (role === "member" || role === "none") {
      throw new ApiError(403, "Forbidden");
    }
  }

  const folder = await Folder.create({
    ...body,
    user_id,
    parent_id,
    workspace_id,
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
  const folder_id = req.params.folder_id || 0;

  const body = req.body;
  const parent_id = body.parent_id;

  const is_access = req.is_access_folder_action;
  const is_access_action = req.is_access_folder_action;

  if (!is_access || !is_access_action) {
    throw new ApiError(403, "Forbidden");
  }

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
      user_id: exist.user_id,
    },
  });

  const updatedFolder = await findExistFolder(Number(folder_id), user_id);
  if (updatedFolder instanceof ApiError) {
    throw updatedFolder;
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "updated folder success",
    data: updatedFolder,
  });
};

export const deleteFolder = async (req: MyRequest, res: Response) => {
  const folder_id = Number(req.params.folder_id || 0);
  const user_id = req.user_id;
  const isForever = req.query.isForever;

  const is_access = req.is_access_folder_action;
  const is_access_action = req.is_access_folder_action;

  if (!is_access || !is_access_action) {
    throw new ApiError(403, "Forbidden");
  }

  const exist = await findExistFolder(folder_id, user_id);
  if (exist instanceof ApiError) {
    throw exist;
  }

  if (exist.deleted && !isForever) {
    throw new ApiError(400, "Folder was be removed");
  }

  const t = await sequelize.transaction();
  try {
    let error = null;
    async function deleteChild(
      isForever: boolean,
      id: number,
      user_id: number
    ) {
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
                  user_id: user_id,
                },
                transaction: t,
              }),
              Note.destroy({
                where: {
                  folder_id: child.id,
                  user_id: user_id,
                },
                transaction: t,
              })
            );
          } else {
            promises.push(
              Folder.update(
                { deleted: true, deletedAt: new Date() },
                { where: { id: child.id, user_id: user_id }, transaction: t }
              ),
              Note.update(
                { deleted: true, deletedAt: new Date() },
                {
                  where: { folder_id: child.id, user_id: user_id },
                  transaction: t,
                }
              )
            );
          }
          promises.push(deleteChild(isForever, child.id, user_id));
        });

        return await Promise.all(promises);
      } catch (err) {
        error = err;
        return err;
      }
    }

    if (isForever) {
      await Promise.all([
        Folder.destroy({
          where: { id: folder_id, user_id: exist.user_id },
          transaction: t,
        }),
        Note.destroy({
          where: { folder_id: folder_id, user_id: exist.user_id },
          transaction: t,
        }),
      ]);
    } else {
      await Promise.all([
        Folder.update(
          {
            deleted: true,
            deletedAt: new Date(),
          },
          { where: { id: folder_id, user_id: exist.user_id }, transaction: t }
        ),
        Note.update(
          {
            deleted: true,
            deletedAt: new Date(),
          },
          {
            where: { folder_id: folder_id, user_id: exist.user_id },
            transaction: t,
          }
        ),
      ]);
    }

    const bind = await deleteChild(!!isForever, folder_id, exist.user_id);
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

export const createRootFolderAndNoteInTeamspaceDefault = async (
  req: MyRequest,
  res: Response
) => {
  const t = await sequelize.transaction();
  try {
    let workspace_id = Number(req.query.workspace_id || 0);

    if (!workspace_id) {
      throw new ApiError(400, "workspace_id is required");
    }

    const existWorkspace = await Workspace.findByPk(workspace_id);

    const user = await User.findOne({ where: { id: existWorkspace.owner_id } });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const defaultTitle = `${user.fullname}'s Teamspace`;
    const root = await Folder.create(
      {
        user_id: existWorkspace.owner_id,
        workspace_id: workspace_id,
        parent_id: null,
        is_in_teamspace: true,
        title: defaultTitle,
      },
      { transaction: t }
    );

    const note = await Note.create(
      {
        user_id: existWorkspace.owner_id,
        folder_id: root.id,
        workspace_id: workspace_id,
        title: "Teamspace Home",
        content: startingNoteContent,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      success: true,
      status: 201,
      message: "Created root folder and default note success",
      data: { folder: root, note },
    });
  } catch (error) {
    await t.rollback();
    if (!isProduction) {
      console.log(error);
    }
    throw new ApiError(500, "Internal server error");
  }
};

export const createRootFolderAndNotePrivateDefault = async (
  req: MyRequest,
  res: Response
) => {
  const user_id = req.user_id;

  let workspace_id = req.query.workspace_id || 0;

  const data = await createRootFolderAndNoteDefaultForUser(
    user_id,
    Number(workspace_id)
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

const findAllFolderWithParent = async (
  parent_id: number | null,
  user_id: number,
  workspace_id: number
): Promise<FolderModel[] | ApiError> => {
  try {
    if (!workspace_id) {
      throw new ApiError(400, "workspace_id is required");
    }

    const query = `	
		SELECT f1.*, COUNT(f2.id) as count_child, COUNT(n.id) AS count_child_note FROM folders f1
		LEFT JOIN folders f2 ON f2.parent_id = f1.id AND f2.deleted = false
		LEFT JOIN notes n ON n.folder_id = f1.id
		WHERE f1.deleted = false AND f1.user_id = ${user_id} AND f1.parent_id ${
      parent_id === null ? "IS NULL" : `= ${parent_id}`
    } AND f1.workspace_id = ${workspace_id}
		GROUP BY f1.id
		`;

    const folders = (await sequelize.query(query, {
      type: QueryTypes.SELECT,
    })) as FolderModel[];

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
