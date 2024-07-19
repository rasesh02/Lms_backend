import { Router } from "express";
import {registerAgent,loginAgent,dummy} from "../controllers/Admin/agentController.js"
const router=Router();

router.route("/register").post(registerAgent);
router.route("/login").post(loginAgent);
router.route("/dummy").get(dummy);

export default router;