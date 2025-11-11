import { Router } from "express";
import * as controller from "../controllers/note.controller";
import * as authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.get(
	"/",
	authMiddleware.requireAuth,
	controller.getNotesPrivateOrTeamspace
);
router.post("/create", authMiddleware.requireAuth, controller.createNewNote);
router.patch(
	"/update/:note_id",
	authMiddleware.requireAuth,
	controller.updateNote
);
router.delete(
	"/delete/:note_id",
	authMiddleware.requireAuth,
	controller.deleteNote
);
router.get("/default", authMiddleware.requireAuth, controller.getDefaultNote);
router.get(
	"/members/:note_id",
	authMiddleware.requireAuth,
	controller.getMembersInNote
);

// get by slug and maybe need status (public/private)
router.get("/detail/:note_slug", authMiddleware.isAccess, controller.getDetail);

//teamspace note
router.get(
	"/teamspaces",
	authMiddleware.requireAuth,
	controller.getNotesInTeamspace
);

const noteRoute = router;
export default noteRoute;
