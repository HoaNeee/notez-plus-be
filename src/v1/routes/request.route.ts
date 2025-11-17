import { Router } from "express";
import * as controller from "../controllers/request.controller";
import * as authMiddleware from "../middlewares/auth.middleware";
import * as workspaceMiddleware from "../middlewares/workspace-middleware";

const router = Router();

router.get("/", authMiddleware.requireAuth, controller.getAllRequests);
router.post(
	"/:request_id/read",
	authMiddleware.requireAuth,
	workspaceMiddleware.isAccessibleWorkspace,
	controller.markRequestAsRead
);

const requestRoute = router;
export default requestRoute;
