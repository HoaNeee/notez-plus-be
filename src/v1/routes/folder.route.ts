import { Router } from "express";
import * as controller from "../controllers/folder.controller";

const router = Router();

router.get("/", controller.getFoldersPrivate);
router.get("/root", controller.getRootFolderPrivate);
router.post("/create/", controller.createNewFolder);
router.patch("/update/:folder_id", controller.updateFolder);
router.delete("/delete/:folder_id", controller.deleteFolder);
router.get("/detail/:folder_id", controller.getFolderDetail);
router.post(
	"/create-root-and-default-note",
	controller.createRootFolderAndNotePrivateDefault
);

// Teamspace folders
router.get("/teamspace", controller.getFoldersInTeamspace);
router.post(
	"/create-root-and-default-note-teamspace",
	controller.createRootFolderAndNoteInTeamspaceDefault
);

const folderRoute = router;
export default folderRoute;
