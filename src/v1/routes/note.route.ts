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
router.patch(
	"/update-content/:note_id",
	authMiddleware.isAccess,
	noteMiddleware.isAccessNote,
	controller.updateNoteContent
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

router.post(
	`/:note_id/threads/create`,
	authMiddleware.isAccess,
	noteMiddleware.isAccessNote,
	controller.createNewThread
);
router.post(
	`/:note_id/comments/create`,
	authMiddleware.isAccess,
	noteMiddleware.isAccessNote,
	controller.createComment
);
router.delete(
	`/:note_id/comments/delete/:comment_id`,
	authMiddleware.isAccess,
	noteMiddleware.isAccessNote,
	controller.deleteComment
);
router.delete(
	`/:note_id/threads/delete/:thread_id`,
	authMiddleware.isAccess,
	noteMiddleware.isAccessNote,
	controller.deleteThread
);

// get by slug and maybe need status (public/private)
router.get(
	"/detail/:note_slug",
	authMiddleware.isAccess,
	controller.getDetailNote
);

//teamspace note
router.get(
	"/teamspaces",
	authMiddleware.requireAuth,
	controller.getNotesInTeamspace
);

const noteRoute = router;
export default noteRoute;
