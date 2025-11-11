import { Router } from "express";
import * as controller from "../controllers/folder.controller";

const router = Router();

router.get("/", controller.getFoldersPrivate);
router.get("/root", controller.getRootFolder);
router.get("/detail/:folder_id", controller.getFolderDetail);

router.post("/create/", controller.createNewFolder);
router.patch("/update/:folder_id", controller.updateFolder);
router.delete("/delete/:folder_id", controller.deleteFolder);
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
