import { Op, QueryTypes, where } from "sequelize";
import { MyRequest } from "../middlewares/auth.middleware";
import { Response } from "express";
import {
  Folder,
  Note,
  RequestModel,
  RequestTarget,
  sequelize,
  User,
  Workspace,
  WorkspaceDetail,
  WorkspaceSetting,
} from "../models";
import ApiError from "../../../utils/api-error";
import {
  createRootFolderAndNoteDefaultForUser,
  createWorkspaceForUser,
  findExistMemberInWorkspace,
  getRootFolderPrivateHelper,
} from "./utils/utils";
import { UserModel } from "../models/user";
import { WorkspaceDetailModel } from "../models/workspacedetail";
import { log_action } from "../../../utils/utils";
import { RequestType } from "../models/requestmodel";
import { RequestRefType } from "../models/requesttarget";
import { RoleInWorkspace, WorkspaceModel } from "../models/workspace";

export const getAllWorkspaces = async (req: MyRequest, res: Response) => {
  const owner_id = req.user_id;

  const query = `
    SELECT ws.*, wd.role, COUNT(wd2.id) AS member_count
    FROM workspace_details wd
    JOIN workspaces ws ON ws.id = wd.workspace_id
    LEFT JOIN workspace_details wd2 ON wd2.workspace_id = ws.id
    WHERE wd.member_id = ?
    GROUP BY wd.id, ws.id
    `;

  const workspaces = (await sequelize.query(
    { query: query, values: [owner_id] },
    { type: QueryTypes.SELECT }
  )) as (WorkspaceModel & { role: string; member_count: number })[];

  const w_ids = workspaces.map((w) => w.id);

  const query2 = `
  SELECT ws.*, np.permission FROM note_permissions np
  JOIN notes nt ON nt.id = np.note_id
  JOIN folders f ON f.id = nt.folder_id
  JOIN workspaces ws ON ws.id = f.workspace_id
  WHERE np.user_id = :user_id AND ws.id NOT IN (:w_ids) AND nt.status = 'shared' AND nt.deleted = false`;

  const workspacesBeInvited = await sequelize.query(query2, {
    type: QueryTypes.SELECT,
    replacements: {
      user_id: owner_id,
      w_ids: w_ids.length ? w_ids : [0],
    },
  });

  for (const w of workspacesBeInvited) {
    w["is_guest"] = true;
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get all workspaces success",
    data: { workspaces: workspaces, workspacesBeInvited },
  });
};

export const getDefaultWorkspace = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;

  const workspace = await Workspace.findOne({
    where: {
      owner_id: user_id,
      deleted: false,
    },
  });
  if (!workspace) {
    throw new ApiError(404, "Default workspace not found");
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get default workspace success",
    data: workspace,
  });
};

export const createNewWorkspace = async (req: MyRequest, res: Response) => {
  const owner_id = req.user_id;

  const body = req.body;

  let defaultTitle = body.title;

  const workspace = await createWorkspaceForUser(owner_id, defaultTitle);

  if (workspace instanceof ApiError) {
    throw workspace;
  }

  await WorkspaceSetting.create({
    workspace_id: workspace.id,
  });

  res.status(201).json({
    success: true,
    status: 201,
    message: "Create new workspace success",
    data: workspace,
  });
};

//create new workspace, members, setting, default folder and note, default folder, note in teamspace
export const createNewWorkspaceFullHelper = async (
  req: MyRequest,
  res: Response
) => {
  res.status(201).json({
    success: true,
    status: 201,
    message: "Create new workspace full success",
  });
};

export const createDefaultWorkspace = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;
  const workspace = await createWorkspaceForUser(user_id);

  if (workspace instanceof ApiError) {
    throw workspace;
  }

  res.status(201).json({
    success: true,
    status: 201,
    message: "Create default workspace success",
    data: workspace,
  });
};

export const updateWorkspace = async (req: MyRequest, res: Response) => {
  const workspace_id = Number(req.params.workspace_id || 0);
  const body = req.body;
  const workspace_role = req.workspace_role;

  if (workspace_role !== RoleInWorkspace.ADMIN) {
    throw new ApiError(
      403,
      "You do not have permission to update this workspace"
    );
  }

  const workspace = await findExistWorkspace(workspace_id);

  if (workspace instanceof ApiError) {
    throw workspace;
  }

  await Workspace.update(
    { ...body },
    { where: { id: workspace_id }, returning: true }
  );

  const updatedWorkspace = await Workspace.findByPk(workspace_id);

  res.status(200).json({
    success: true,
    status: 200,
    message: "Update workspace success",
    data: updatedWorkspace,
  });
};

export const addMembersToWorkspace = async (req: MyRequest, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const user_id = req.user_id;
    const workspace_id = Number(req.params.workspace_id || 0);
    const body = req.body;
    const emails = body.emails as string[];
    const role = body.role || "member";
    const message = body.message || "";

    const workspace_role = req.workspace_role;

    if (workspace_role !== RoleInWorkspace.ADMIN) {
      throw new ApiError(
        403,
        "You do not have permission to add members to this workspace"
      );
    }

    const query = `
		SELECT id, email, fullname, avatar FROM users WHERE email IN (:emails)
	`;

    const members = (await sequelize.query(query, {
      replacements: { emails },
      type: QueryTypes.SELECT,
    })) as UserModel[];

    const emailsCanNotBeInvited = members
      .filter((mem) => !emails.includes(mem.email))
      .map((m) => m.email);

    if (!members || !members.length) {
      res.status(200).json({
        success: true,
        status: 200,
        message: "Invite members to workspace success",
        data: { members: [], emailsCanNotBeInvited },
      });
    }

    const mem_ids = members.map((m: UserModel) => m.id);

    const existMemberInWorkspace = await sequelize.query(
      `
		SELECT * FROM workspace_details
		WHERE workspace_id = :workspace_id AND member_id IN (:mem_ids)
	`,
      {
        replacements: { workspace_id: workspace_id, mem_ids },
        type: QueryTypes.SELECT,
      }
    );

    const existMem_ids = existMemberInWorkspace.map(
      (m: WorkspaceDetailModel) => m.member_id
    );

    const new_ids = mem_ids.filter((id) => !existMem_ids.includes(id));

    const existWorkspace = await findExistWorkspace(workspace_id);

    if (existWorkspace instanceof ApiError) {
      throw existWorkspace;
    }

    //maybe need to send email,request first invitation here

    await Promise.all(
      new_ids.map((member_id) => {
        const fn = async () => {
          const request = await RequestModel.create(
            {
              sender_id: user_id,
              receiver_id: member_id,
              request_type: RequestType.INVITE,
              status: "accepted",
              workspace_id: workspace_id,
            },
            { transaction: t }
          );

          if (request) {
            await RequestTarget.create(
              {
                request_id: request.id,
                ref_type: RequestRefType.WORKSPACE,
                ref_id: workspace_id,
                ref_extra: JSON.stringify({ role: role }),
                message: message,
              },
              { transaction: t }
            );
          }
        };

        return Promise.all([
          fn(),
          WorkspaceDetail.create(
            {
              workspace_id: workspace_id,
              member_id,
              role: role,
              message,
            },
            { transaction: t }
          ),
          createRootFolderAndNoteDefaultForUser(member_id, workspace_id, t),
        ]);
      })
    );

    await t.commit();

    //dev
    log_action(
      `Send request to new members to workspace ${workspace_id}:`,
      members.filter((m: UserModel) => new_ids.includes(m.id))
    );

    const users = await User.findAll({
      where: {
        id: {
          [Op.in]: new_ids,
        },
        status: "active",
      },
    });

    const membersInvited = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullname: u.fullname,
      avatar: u.avatar,
      role: role,
    }));

    res.status(200).json({
      success: true,
      status: 200,
      message: "Invite members to workspace success",
      data: { members: membersInvited, emailsCanNotBeInvited },
    });
  } catch (error) {
    await t.rollback();
    log_action("Error in addNewMembersToWorkspace:", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
};

export const updateMemberInWorkspace = async (
  req: MyRequest,
  res: Response
) => {
  const workspace_id = Number(req.params.workspace_id || 0);
  const body = req.body;
  const member_email = body.email;

  const workspace_role = req.workspace_role;

  if (workspace_role !== RoleInWorkspace.ADMIN) {
    throw new ApiError(
      403,
      "You do not have permission to update members in this workspace"
    );
  }

  const member = await User.findOne({
    where: { email: member_email },
    attributes: {
      exclude: ["password"],
      include: ["id", "email", "fullname", "avatar"],
    },
  });
  if (!member) {
    throw new ApiError(404, "Member not found");
  }

  const existWorkspace = await findExistWorkspace(workspace_id);

  if (existWorkspace instanceof ApiError) {
    throw existWorkspace;
  }

  await WorkspaceDetail.update(
    { ...body },
    { where: { workspace_id: workspace_id, member_id: member.id } }
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Update member in workspace success",
  });
};

export const removeMemberFromWorkspace = async (
  req: MyRequest,
  res: Response
) => {
  const workspace_id = Number(req.params.workspace_id || 0);
  const body = req.body;
  const member_email = body.email;
  const user_id = req.user_id;

  const workspace_role = req.workspace_role;

  if (workspace_role !== RoleInWorkspace.ADMIN) {
    throw new ApiError(
      403,
      "You do not have permission to remove members from this workspace"
    );
  }

  const member = await User.findOne({
    where: { email: member_email },
    attributes: {
      exclude: ["password"],
      include: ["id", "email", "fullname", "avatar"],
    },
  });
  if (!member) {
    throw new ApiError(404, "Member not found");
  }

  const existWorkspace = await findExistWorkspace(workspace_id);
  if (existWorkspace instanceof ApiError) {
    throw existWorkspace;
  }

  //if the member is removing self, and is the owner, need transfer ownership
  if (member.id === user_id && existWorkspace.owner_id === member.id) {
    const memberRemaining = await WorkspaceDetail.findAll({
      where: { workspace_id: workspace_id, member_id: { [Op.ne]: member.id } },
    });

    if (
      !memberRemaining.length ||
      memberRemaining.every((m) => m.role !== "admin")
    ) {
      throw new ApiError(
        400,
        "Cannot remove the last admin from the workspace"
      );
    }

    const otherAdmin = memberRemaining.find((m) => m.role === "admin");
    if (!otherAdmin) {
      throw new ApiError(
        400,
        "Please assign another admin before removing yourself from the workspace"
      );
    }

    await WorkspaceDetail.update(
      { role: "admin", owner_id: otherAdmin.member_id },
      {
        where: { workspace_id: workspace_id, member_id: otherAdmin.member_id },
      }
    );
  }

  const folderInWorkspace = await Folder.findAll({
    where: {
      workspace_id: workspace_id,
      user_id: member.id,
      is_in_teamspace: false,
    },
  });

  const folder_ids = folderInWorkspace.map((f) => f.id);

  if (folder_ids.length) {
    await Note.destroy({
      where: {
        folder_id: { [Op.in]: folder_ids },
        user_id: member.id,
      },
    });
    await Folder.destroy({
      where: {
        id: { [Op.in]: folder_ids },
        user_id: member.id,
        is_in_teamspace: false,
      },
    });
  }

  await WorkspaceDetail.destroy({
    where: { workspace_id: Number(workspace_id), member_id: member.id },
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Remove member from workspace success",
    data: { member: member },
  });
};

export const getDetailWorkspace = async (req: MyRequest, res: Response) => {
  const user_id = req.user_id;
  const workspace_id = Number(req.params.workspace_id || 0);
  const is_guest = Number(req.query.is_guest || 0) === 1;

  const workspace_role = req.workspace_role;

  if (is_guest) {
    const workspace = await findExistWorkspace(Number(workspace_id || 0));
    if (workspace instanceof ApiError) {
      throw workspace;
    }

    const query = `
			SELECT n.* FROM notes n
			JOIN folders f ON f.id = n.folder_id
			JOIN workspaces w ON w.id = f.workspace_id
			JOIN note_permissions np ON np.note_id = n.id
			WHERE w.id = ? AND np.user_id = ? AND n.deleted = false AND n.status = 'shared'
			ORDER BY n.updatedAt DESC
		`;

    const notesSharedInWorkspaceWithUser = await sequelize.query(
      {
        query: query,
        values: [workspace.id, user_id],
      },
      { type: QueryTypes.SELECT }
    );

    if (
      !notesSharedInWorkspaceWithUser ||
      !notesSharedInWorkspaceWithUser.length
    ) {
      throw new ApiError(
        403,
        "You do not have permission to access this workspace"
      );
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Get workspace detail success",
      data: {
        workspace: {
          ...workspace,
          is_guest: true,
        },
        defaultNote: notesSharedInWorkspaceWithUser[0],
      },
    });
    return;
  }

  const existWorkspace = await getExistWorkspaceWithMemberAndRole(
    user_id,
    workspace_id
  );

  if (existWorkspace instanceof ApiError) {
    throw existWorkspace;
  }

  if (workspace_role === RoleInWorkspace.NONE) {
    throw new ApiError(
      403,
      "You do not have permission to access this workspace"
    );
  }

  const { workspace, member } = existWorkspace;

  const rootFolderPrivateInWorkspace = await getRootFolderPrivateHelper(
    user_id,
    workspace.id
  );

  let defaultNote = null;

  if (!(rootFolderPrivateInWorkspace instanceof ApiError)) {
    const note = await Note.findOne({
      where: {
        folder_id: rootFolderPrivateInWorkspace.id,
        deleted: false,
        user_id,
      },
      order: [["updatedAt", "DESC"]],
    });

    if (note) {
      defaultNote = note;
    }
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get workspace detail success",
    data: {
      workspace: {
        ...workspace,
        role: member.role || "member",
        is_guest: false,
      },
      defaultNote,
    },
  });
};

export const removeWorkspace = async (req: MyRequest, res: Response) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: "Remove workspace success",
    data: {},
  });
};

export const getMembersInWorkspace = async (req: MyRequest, res: Response) => {
  const workspace_id = Number(req.params.workspace_id || 0);
  const workspace_role = req.workspace_role;

  if (workspace_role === RoleInWorkspace.NONE) {
    throw new ApiError(
      403,
      "You do not have permission to access members in this workspace"
    );
  }

  const exist = await findExistWorkspace(workspace_id);
  if (exist instanceof ApiError) {
    throw exist;
  }

  const query = `
		SELECT u.id, u.email, u.fullname, u.avatar, wd.role
		FROM users u
		JOIN workspace_details wd ON wd.member_id = u.id
		WHERE wd.workspace_id = :workspace_id
	`;

  const members = await sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { workspace_id },
  });

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get members in workspace success",
    data: { members },
  });
};

export const getWorkspaceSetting = async (req: MyRequest, res: Response) => {
  const workspace_id = Number(req.params.workspace_id || 0);
  const workspace_role = req.workspace_role;
  if (workspace_role !== RoleInWorkspace.ADMIN) {
    throw new ApiError(
      403,
      "You do not have permission to access settings in this workspace"
    );
  }

  const setting = await WorkspaceSetting.findOne({ where: { workspace_id } });

  if (!setting) {
    //can be created default setting here
    throw new ApiError(404, "Workspace setting not found");
  }

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get workspace setting success",
    data: { setting },
  });
};

export const updateWorkspaceSetting = async (req: MyRequest, res: Response) => {
  const workspace_id = Number(req.params.workspace_id || 0);
  const workspace_role = req.workspace_role;
  const body = req.body;
  const workspace_setting_id = Number(req.params.workspace_setting_id || 0);

  if (workspace_role !== RoleInWorkspace.ADMIN) {
    throw new ApiError(
      403,
      "You do not have permission to access settings in this workspace"
    );
  }

  await WorkspaceSetting.update(
    { ...body },
    { where: { workspace_id: workspace_id, id: workspace_setting_id } }
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Update workspace setting success",
  });
};

async function findExistWorkspace(workspace_id: number) {
  try {
    const [workspace, workspaceDetail] = await Promise.all([
      Workspace.findOne({
        where: {
          id: workspace_id,
        },
      }),
      WorkspaceDetail.findOne({
        where: {
          workspace_id: workspace_id,
        },
      }),
    ]);

    if (!workspace) {
      throw new ApiError(404, "Workspace not found");
    }

    return {
      ...workspace,
      role: workspaceDetail ? workspaceDetail.role : "member",
    };
  } catch (error) {
    return new ApiError(
      error.statusCode || 500,
      error.message || "Internal server error"
    );
  }
}

async function getExistWorkspaceWithMemberAndRole(
  user_id: number,
  workspace_id: number
) {
  try {
    if (!workspace_id) {
      return new ApiError(400, "Workspace ID is required");
    }

    const workspace = await findExistWorkspace(workspace_id);

    if (workspace instanceof ApiError) {
      return workspace;
    }

    const member = await findExistMemberInWorkspace(workspace_id, user_id);

    if (member instanceof ApiError) {
      return member;
    }

    return { workspace, member };
  } catch (error) {
    if (error instanceof ApiError) {
      return new ApiError(error.statusCode, error.message);
    }
    return new ApiError(500, "Internal server error");
  }
}
