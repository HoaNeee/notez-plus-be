import { Router } from "express";
import * as controller from "../controllers/request.controller";
import * as authMiddleware from "../middlewares/auth.middleware";
import * as workspaceMiddleware from "../middlewares/workspace-middleware";

const router = Router();

router.get(
  "/",
  authMiddleware.requireAuth,
  controller.getAllRequestsInWorkspace
);
router.post(
  "/create/note",
  authMiddleware.requireAuth,
  workspaceMiddleware.isAccessibleWorkspace,
  controller.createNewNoteRequest
);
router.post(
  "/:request_id/read",
  authMiddleware.requireAuth,
  workspaceMiddleware.isAccessibleWorkspace,
  controller.markRequestAsRead
);
router.patch(
  "/update-status/:request_id",
  authMiddleware.requireAuth,
  workspaceMiddleware.isAccessibleWorkspace,
  controller.updateRequestStatus
);

const requestRoute = router;
export default requestRoute;
