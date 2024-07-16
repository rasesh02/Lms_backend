import { Router } from "express";
import {registerAgent,loginAgent} from "../controllers/Admin/agentController.js"
const router=Router();

router.route("/register").post(registerAgent);
router.route("/login").post(loginAgent);

export default router;