import slugify from "slugify";
import ApiError from "../../../../utils/api-error";
import { startingNoteContent } from "../../../../utils/contants";
import { isProduction } from "../../../../utils/utils";
import {
  Folder,
  Note,
  sequelize,
  User,
  Workspace,
  WorkspaceDetail,
} from "../../models";

export const createRootFolderAndNoteDefaultForUser = async (
  user_id: number,
  workspace_id: number
) => {
  const t = await sequelize.transaction();

  try {
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

    await t.commit();

    return { rootFolder, note };
  } catch (error) {
    await t.rollback();

    if (!isProduction) {
      console.log(error);
    }

    return new ApiError(500, "Internal server error");
  }
};

export const createDefaultWorkspaceForUser = async (user_id: number) => {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return new ApiError(404, "User not found");
    }

    const workspace = await Workspace.create(
      {
        user_id,
        name: "Workspace de " + user.fullname || "Default",
        is_default: true,
      },
      { transaction: t }
    );

    // Add user as owner in workspace details
    await WorkspaceDetail.create(
      {
        workspace_id: workspace.id,
        member_id: user_id,
        role: "owner",
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
    return new ApiError(500, "Internal server error");
  }
};

export const getRootFolderHelper = async (user_id: number) => {
  try {
    const root = await Folder.findOne({
      where: {
        user_id,
        deleted: false,
        parent_id: null,
      },
    });

    if (!root) {
      //create new root folder here or throw
      throw new ApiError(404, "Root folder not found");
    }
    return root;
  } catch (error) {
    if (error instanceof ApiError) {
      return new ApiError(error.statusCode, error.message);
    }
    return new ApiError(500, "Internal server error");
  }
};
