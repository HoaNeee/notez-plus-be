import { Router } from "express";
import * as controller from "../controllers/workspace.controller";

const router = Router();

router.get("/", controller.getAllWorkspaces);
router.get("/detail/:workspace_id", controller.getDetailWorkspace);
router.post("/create-new", controller.createNewWorkspace);
router.post("/create-default", controller.createDefaultWorkspace);
router.post("/add-member/:workspace_id", controller.addNewMemberToWorkspace);
router.patch(
	"/update-member/:workspace_id",
	controller.updateMemberInWorkspace
);
router.delete(
	"/remove-member/:workspace_id",
	controller.removeMemberFromWorkspace
);
router.patch("/update/:workspace_id", controller.updateWorkspace);
router.delete("/remove/:workspace_id", controller.removeWorkspace);

const workspaceRoute = router;
export default workspaceRoute;
