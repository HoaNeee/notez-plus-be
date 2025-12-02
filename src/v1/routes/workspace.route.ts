import { Router } from "express";
import * as controller from "../controllers/workspace.controller";
import * as workspaceMiddleware from "../middlewares/workspace-middleware";

const router = Router();

router.get("/", controller.getAllWorkspaces);
router.get("/default", controller.getDefaultWorkspace);
router.post("/create-new", controller.createNewWorkspace);
router.post("/create-default", controller.createDefaultWorkspace);
router.get("/last-workspace", controller.getLastWorkspace);
router.get(
	"/setting/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.getWorkspaceSetting
);
router.get(
	"/detail/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.getDetailWorkspace
);

router.get(
	"/members/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.getMembersInWorkspace
);
router.post(
	"/members/add/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.addMembersToWorkspace
);
router.patch(
	"/members/update/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.updateMemberInWorkspace
);
router.delete(
	"/members/remove/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.removeMemberFromWorkspace
);
router.patch(
	"/update/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.updateWorkspace
);
router.patch(
	"/setting/:workspace_id/update/:workspace_setting_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.updateWorkspaceSetting
);
router.delete(
	"/remove/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.removeWorkspace
);
const workspaceRoute = router;
export default workspaceRoute;
