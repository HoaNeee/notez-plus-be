import { Router } from "express";
import * as controller from "../controllers/trash.controller";
import * as workspaceMiddleware from "../middlewares/workspace-middleware";

const router = Router();

router.get(
	"/:workspace_id",
	workspaceMiddleware.isAccessibleWorkspace,
	controller.getTrashNotes
);

const trashRoute = router;

export default trashRoute;
