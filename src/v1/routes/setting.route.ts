import { Router } from "express";
import * as controller from "../controllers/setting.controller";

const router = Router();

router.get("/", controller.getSettingOfUser);
router.patch("/update/:action", controller.updateSettingOfUser);

const settingRoute = router;

export default settingRoute;
