import { QueryTypes } from "sequelize";
import { MyRequest } from "../middlewares/auth.middleware";
import { Response } from "express";
import { sequelize, Workspace, WorkspaceDetail } from "../models";

export const getAllWorkspaces = async (req: MyRequest, res: Response) => {
  const owner_id = req.user_id;

  const query = `
    SELECT ws2.*, wd.role
    FROM workspace_details wd
    JOIN workspaces ws ON wd.member_id = ws.owner_id
    JOIN workspaces ws2 ON ws2.id = wd.workspace_id
    WHERE ws.owner_id = ?
    GROUP BY wd.id, ws2.id
    `;

  const workspaces = await sequelize.query(
    { query: query, values: [owner_id] },
    { type: QueryTypes.SELECT }
  );

  res.status(200).json({
    success: true,
    status: 200,
    message: "Get all workspaces success",
    data: { workspaces: workspaces },
  });
};

export const createNewWorkspace = async (req: MyRequest, res: Response) => {
  const owner_id = req.user_id;

  const body = req.body;

  const workspace = await Workspace.create({
    ...body,
    owner_id,
  });

  res.status(201).json({
    success: true,
    status: 201,
    message: "Create new workspace success",
    data: workspace,
  });
};

export const createDefaultWorkspace = async (req: MyRequest, res: Response) => {
  res.status(201).json({
    success: true,
    status: 201,
    message: "Create default workspace success",
    data: {},
  });
};

export const updateWorkspace = async (req: MyRequest, res: Response) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: "Update workspace success",
    data: {},
  });
};

export const getDetailWorkspace = async (req: MyRequest, res: Response) => {
  res.status(200).json({
    success: true,
    status: 200,
    message: "Get workspace detail success",
    data: {},
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
