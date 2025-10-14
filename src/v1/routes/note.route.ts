import { Router } from "express";
import * as controller from "../controllers/note.controller";

const router = Router();

router.get("/", controller.getNotes);
router.post("/create", controller.createNewNote);
router.patch("/update/:note_id", controller.updateNote);
router.delete("/delete/:note_id", controller.deleteNote);
router.get("/detail/:note_slug", controller.getDetail);

const noteRoute = router;
export default noteRoute;
