import { Router } from "express";
import * as controller from "../controllers/note.controller";
import * as authMiddleware from "../middlewares/auth.middleware";
import * as noteMiddleware from "../middlewares/note-middleware";
import * as workspaceMiddleware from "../middlewares/workspace-middleware";

const router = Router();

router.get(
	"/",
	authMiddleware.requireAuth,
	controller.getNotesPrivateOrTeamspace
);
router.get(
	"/last-note",
	authMiddleware.requireAuth,
	controller.getLastNoteAdjusted
);
router.post("/create", authMiddleware.requireAuth, controller.createNewNote);
router.patch(
	"/update/:note_id",
	authMiddleware.requireAuth,
	noteMiddleware.isAccessNote,
	controller.updateNote
);
router.delete(
	"/move-to-trash/:note_id",
	authMiddleware.requireAuth,
	noteMiddleware.isAccessNote,
	controller.deleteNote
);
router.get("/default", authMiddleware.requireAuth, controller.getDefaultNote);
router.get(
	"/members/:note_id",
	authMiddleware.requireAuth,
	noteMiddleware.isAccessNote,
	controller.getMembersInNote
);

router.post(
	"/members/invite/:note_id",
	authMiddleware.requireAuth,
	noteMiddleware.isAccessNote,
	controller.addMembersToNote
);
router.delete(
	"/members/remove/:note_id/:member_id",
	authMiddleware.requireAuth,
	noteMiddleware.isAccessNote,
	controller.removeMemberFromNote
);
router.patch(
	"/members/update/:note_id",
	authMiddleware.requireAuth,
	noteMiddleware.isAccessNote,
	controller.updateMemberInNote
);

//favorite
router.get(
	"/favorites/:workspace_id",
	authMiddleware.requireAuth,
	workspaceMiddleware.isAccessibleWorkspace,
	controller.getFavoriteNotes
);

router.patch(
	"/favorites/update/:action/:note_id",
	authMiddleware.requireAuth,
	workspaceMiddleware.isAccessibleWorkspace,
	noteMiddleware.isAccessNote,
	controller.favoriteNoteAction
);
// end favorite

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
