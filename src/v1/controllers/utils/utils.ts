import slugify from "slugify";
import ApiError from "../../../../utils/api-error";
import { startingNoteContent } from "../../../../utils/contants";
import { isProduction } from "../../../../utils/utils";
import {
  Folder,
  Note,
  NoteLog,
  sequelize,
  User,
  Workspace,
  WorkspaceDetail,
} from "../../models";
import { FolderModel } from "../../models/folder";
import { Transaction } from "sequelize";
import { NoteLogRefAction } from "../../models/notelogs";

export const createRootFolderAndNoteDefaultForUser = async (
  user_id: number,
  workspace_id: number,
  transaction?: Transaction
) => {
  if (!user_id || !workspace_id) {
    return new ApiError(400, "user_id and workspace_id are required");
  }

  const t = transaction || (await sequelize.transaction());

  try {
    const existRoot = await getRootFolderPrivateHelper(user_id, workspace_id);

    if (!(existRoot instanceof ApiError)) {
      await Promise.all([
        Folder.destroy({
          where: {
            id: existRoot.id,
            workspace_id,
            parent_id: null,
          },
          transaction: t,
        }),
        Note.destroy({
          where: {
            folder_id: existRoot.id,
          },
          transaction: t,
        }),
      ]);
    }

    const rootFolder = await Folder.create(
      {
        user_id,
        title: "Root",
        parent_id: null,
        workspace_id,
      },
      { transaction: t }
    );

    const note = await Note.create(
      {
        user_id,
        title: "Getting Started",
        content: startingNoteContent,
        folder_id: rootFolder.id,
      },
      { transaction: t }
    );

    const slug = slugify(`${note.title || ""}-${note.id}`, {
      lower: true,
      strict: true,
    });
    note.slug = slug;

    if (!transaction) {
      await t.commit();
    }

    return { rootFolder, note };
  } catch (error) {
    if (!transaction) {
      await t.rollback();

      return new ApiError(
        error.statusCode || 500,
        error.message || "Internal server error"
      );
    }

    throw new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export const createWorkspaceForUser = async (
  user_id: number,
  title?: string
) => {
  const t = await sequelize.transaction();
  try {
    if (!title || title.trim() === "") {
      const user = await User.findByPk(user_id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      title = user.fullname
        ? user.fullname + "'s Workspace"
        : "Default Workspace";
    }

    const workspace = await Workspace.create(
      {
        owner_id: user_id,
        title,
        is_default: true,
      },
      { transaction: t }
    );

    // Add user as admin in workspace details
    await WorkspaceDetail.create(
      {
        workspace_id: workspace.id,
        member_id: user_id,
        role: "admin",
      },
      { transaction: t }
    );

    await t.commit();

    return workspace;
  } catch (error) {
    await t.rollback();
    if (!isProduction) {
      console.log(error);
    }

    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export const getRootFolderPrivateHelper = async (
  user_id: number,
  workspace_id: number
) => {
  try {
    if (!workspace_id || !user_id) {
      throw new ApiError(400, "workspace_id and user_id are required");
    }

    const roots = await Folder.findAll({
      where: {
        workspace_id,
        deleted: false,
        parent_id: null,
        is_in_teamspace: false,
      },
    });

    if (!roots || !roots.length) {
      throw new ApiError(404, "Root folder private not found");
    }

    const root = roots.find((r) => r.user_id === user_id);

    if (root) {
      return root;
    }

    throw new ApiError(403);
  } catch (error) {
    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export const getRootFolderInTeamspace = async (
  user_id: number,
  workspace_id: number
) => {
  try {
    if (!workspace_id || !user_id) {
      throw new ApiError(400, "workspace_id and user_id are required");
    }

    const root = await Folder.findOne({
      where: {
        workspace_id,
        deleted: false,
        parent_id: null,
        is_in_teamspace: true,
      },
    });

    if (!root) {
      throw new ApiError(404, "Root folder in teamspace not found");
    }

    return root;
  } catch (error) {
    if (error instanceof ApiError) {
      return new ApiError(error.statusCode, error.message);
    }
    return new ApiError(500, "Internal server error");
  }
};

export const findExistFolder = async (id: number, user_id?: number) => {
  try {
    if (!id) {
      throw new ApiError(400, "Folder ID is required");
    }

    const exist = await Folder.findOne({
      where: {
        id,
      },
    });

    if (!exist) {
      throw new ApiError(404, "Folder not found");
    }

    return exist;
  } catch (error) {
    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export const findExistMemberInWorkspace = async (
  workspace_id: number,
  user_id: number
) => {
  try {
    const workspaceDetail = await WorkspaceDetail.findOne({
      where: {
        workspace_id,
        member_id: user_id,
      },
    });

    if (!workspaceDetail) {
      throw new ApiError(404, "Member not found in this workspace");
    }

    return workspaceDetail;
  } catch (error) {
    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export const findExistMemberInWorkspaceWithFolderId = async (
  folder_id: number,
  user_id: number
) => {
  try {
    const folder = await Folder.findByPk(folder_id);
    if (!folder) {
      throw new ApiError(404, "Folder not found");
    }

    const workspaceDetail = await WorkspaceDetail.findOne({
      where: {
        workspace_id: folder.workspace_id,
        member_id: user_id,
      },
    });

    if (!workspaceDetail) {
      throw new ApiError(404, "Member not found in this workspace");
    }

    return workspaceDetail;
  } catch (error) {
    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export const checkIsAccessFolderAction = async (
  folder: FolderModel,
  user_id: number
) => {
  try {
    if (!folder || !user_id) {
      throw new ApiError(400, "Bad request");
    }

    if (folder.user_id === user_id) {
      return true;
    }

    const exist = await findExistMemberInWorkspace(
      folder.workspace_id,
      user_id
    );
    if (exist instanceof ApiError) {
      throw exist;
    }

    if (exist.role !== "admin") {
      throw new ApiError(403, "You don't have permission to access");
    }

    return true;
  } catch (error) {
    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export const checkIsAccessFolder = async (
  folder: FolderModel,
  user_id: number
) => {
  try {
    if (folder.user_id === user_id) {
      return true;
    }

    const exist = await findExistMemberInWorkspace(
      folder.workspace_id,
      user_id
    );
    if (exist instanceof ApiError) {
      throw exist;
    }

    return true;
  } catch (error) {
    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export async function deleteNoteUtils({
  note_id,
  folder_id,
  user_id,
  transaction = null,
  is_forever = false,
}: {
  note_id?: number;
  transaction?: Transaction;
  user_id?: number;
  folder_id?: number;
  is_forever?: boolean;
}) {
  try {
    if (!note_id && !folder_id) {
      throw new ApiError(400);
    }

    //all notes in folder
    if (folder_id && !note_id) {
      const notes = await Note.findAll({
        where: { folder_id, deleted: false },
      });

      const note_ids = notes.map((n) => n.id);

      if (is_forever) {
        await Promise.all([
          Note.destroy({
            where: { folder_id },
            transaction,
          }),
          ...note_ids.map((n_id) => {
            return NoteLog.destroy({
              where: { note_id: n_id },
              transaction,
            });
          }),
        ]);
      } else {
        await Promise.all([
          Note.update(
            { deleted: true },
            {
              where: { folder_id },
              transaction: transaction,
            }
          ),
          ...note_ids.map((n_id) => {
            return NoteLog.create(
              {
                note_id: n_id,
                ref_action: NoteLogRefAction.DELETE,
                ref_action_by: user_id || 0,
              },
              { transaction }
            );
          }),
        ]);
      }

      return;
    }

    if (is_forever) {
      await Promise.all([
        Note.destroy({
          where: {
            id: note_id,
          },
          transaction,
        }),
        NoteLog.destroy({
          where: {
            note_id: note_id,
          },
          transaction,
        }),
      ]);
    } else {
      await Promise.all([
        Note.update(
          { deleted: true },
          {
            where: { id: note_id },
            transaction: transaction,
          }
        ),
        NoteLog.create(
          {
            note_id: note_id,
            ref_action: NoteLogRefAction.DELETE,
            ref_action_by: user_id,
          },
          { transaction }
        ),
      ]);
    }
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || error || "Internal server error"
    );
  }
}

export async function deleteFolderUtils({
  folder_id,
  transaction = null,
  is_forever = false,
}: {
  folder_id: number;
  transaction?: Transaction;
  is_forever?: boolean;
}) {
  try {
    if (!folder_id) {
      throw new ApiError(400, "folder_id is required");
    }

    if (is_forever) {
      await Folder.destroy({
        where: {
          id: folder_id,
        },
        transaction,
      });
    } else {
      await Folder.update(
        { deleted: true, deletedAt: new Date() },
        { where: { id: folder_id }, transaction }
      );
    }
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || error || "Internal server error"
    );
  }
}
