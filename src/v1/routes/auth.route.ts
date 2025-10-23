import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.post("/check-email", authController.checkEmailExist);
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/verify-code", authController.verifyCode);
router.post("/resend-code", authController.resendCode);

router.get(
  "/current-user",
  authMiddleware.requireAuth,
  authController.getCurrentUser
);
router.post("/logout", authMiddleware.requireAuth, authController.logout);

const authRoute = router;
export default authRoute;
