import { Router } from "express";
import * as authMiddleware from "../middlewares/auth.middleware";
import * as controller from "../controllers/workspace.controller";

const router = Router();

router.get("/", controller.getAllWorkspaces);

const workspaceRoute = router;
export default workspaceRoute;
