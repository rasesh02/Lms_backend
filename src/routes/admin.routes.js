import {Router} from "express";
import {registerAdmin, loginAdmin,changePassword,logoutAdmin, updateAdminProfile, getAllAgents, deleteAgent, updateAgent} from "../controllers/Admin/admin.controller.js";
import { verifyAdminJWT } from "../middlewares/adminMiddlewares/authMiddleware.js";

const router=Router();

router.route("/register").post(registerAdmin);
router.route("/login").post(loginAdmin);
router.route("/change-password").post(verifyAdminJWT,changePassword);
router.route("/logout").post(verifyAdminJWT,logoutAdmin);
router.route("/updateProfile").post(verifyAdminJWT,updateAdminProfile);
router.route("/getAllAgents").get(verifyAdminJWT,getAllAgents);
router.route("/deleteAgent/:agentId").post(verifyAdminJWT,deleteAgent);
router.route("/updateAgent/:agentId").post(verifyAdminJWT,updateAgent);
export default router;