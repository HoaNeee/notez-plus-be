import { Router } from "express";
import * as controller from "../controllers/trash.controller";
import * as workspaceMiddleware from "../middlewares/workspace-middleware";

const router = Router();

router.get(
  "/notes/:workspace_id",
  workspaceMiddleware.isAccessibleWorkspace,
  controller.getTrashNotes
);
router.get(
  "/folders/:workspace_id",
  workspaceMiddleware.isAccessibleWorkspace,
  controller.getTrashFolders
);
router.patch(
  "/:type/restore/:ref_id",
  workspaceMiddleware.isAccessibleWorkspace,
  controller.restoreItem
);
router.patch(
  "/:type/delete/:ref_id",
  workspaceMiddleware.isAccessibleWorkspace,
  controller.destroyItem
);

const trashRoute = router;

export default trashRoute;
