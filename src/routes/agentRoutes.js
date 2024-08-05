import { Router } from "express";
import {registerAgent,loginAgent,dummy,logoutAgent, 
    updateAgentDetails,changeAgentPassword, getAllLeads,
     addBulkLeadsCSV, addBulkLeadsExcel, sendMailtoLeads} from "../controllers/Admin/agentController.js"
import { verifyAgentJWT } from "../middlewares/adminMiddlewares/agentAuthMiddleware.js";
import { upload } from "../middlewares/multerMiddleware.js";
const router=Router();

router.route("/register").post(registerAgent);
router.route("/login").post(loginAgent);
router.route("/dummy").get(dummy);
router.route("/logout").post(verifyAgentJWT,logoutAgent);
router.route("/updateDetails").post(verifyAgentJWT,updateAgentDetails);
router.route("/change-password").post(verifyAgentJWT,changeAgentPassword);
router.route("/getLeads").get(verifyAgentJWT,getAllLeads);
router.route("/addLeadsCsv").post(verifyAgentJWT,upload.single('file'),addBulkLeadsCSV);
router.route("/addLeadsExcel").post(verifyAgentJWT,upload.single('file'),addBulkLeadsExcel);
router.route("/sendMails").post(verifyAgentJWT,sendMailtoLeads);

export default router;