import { Express } from "express";
import authRoute from "./auth.route";
import folderRoute from "./folder.route";
import noteRoute from "./note.route";
import * as authMiddleware from "../middlewares/auth.middleware";
import uploadRouter from "./upload.route";
import workspaceRoute from "./workspace.route";
import requestRoute from "./request.route";

const router = (app: Express) => {
	const prefix = "/api";
	app.use(prefix + "/auth", authRoute);
	app.use(prefix + "/notes", noteRoute);

	// Protected routes
	app.use(prefix + "/workspaces", authMiddleware.requireAuth, workspaceRoute);
	app.use(prefix + "/folders", authMiddleware.requireAuth, folderRoute);
	app.use(prefix + "/requests", authMiddleware.requireAuth, requestRoute);
	// app.use(prefix + "/upload", authMiddleware.isAccess, uploadRouter);
};

export default router;
