import { Router } from "express";
import * as controller from "../controllers/folder.controller";
import * as folderMiddleware from "../middlewares/folder.middleware";

const router = Router();

router.get("/", controller.getFoldersPrivate);
router.get("/root", controller.getRootFolder);
router.get(
	"/detail/:folder_id",
	folderMiddleware.isAccessibleFolder,
	controller.getFolderDetail
);

router.post("/create/", controller.createNewFolder);
router.patch(
	"/update/:folder_id",
	folderMiddleware.isAccessibleFolder,
	controller.updateFolder
);
router.delete(
	"/delete/:folder_id",
	folderMiddleware.isAccessibleFolder,
	controller.deleteFolder
);
router.post(
	"/create-root-and-default-note",
	controller.createRootFolderAndNotePrivateDefault
);

// Teamspace folders
router.get("/teamspaces", controller.getFoldersInTeamspace);
router.post(
	"/create-root-and-default-note-teamspace",
	controller.createRootFolderAndNoteInTeamspaceDefault
);

const folderRoute = router;
export default folderRoute;
