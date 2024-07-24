import { Router } from "express";
import {registerAgent,loginAgent,dummy,logoutAgent, updateAgentDetails,changeAgentPassword} from "../controllers/Admin/agentController.js"
import { verifyAgentJWT } from "../middlewares/adminMiddlewares/agentAuthMiddleware.js";
const router=Router();

router.route("/register").post(registerAgent);
router.route("/login").post(loginAgent);
router.route("/dummy").get(dummy);
router.route("/logout").post(verifyAgentJWT,logoutAgent);
router.route("/updateDetails").post(verifyAgentJWT,updateAgentDetails);
router.route("/change-password").post(verifyAgentJWT,changeAgentPassword);

export default router;