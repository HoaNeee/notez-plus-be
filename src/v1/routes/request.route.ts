import { Router } from "express";
import * as controller from "../controllers/request.controller";
import * as authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware.requireAuth, controller.getAllRequests);

const requestRoute = router;
export default requestRoute;
