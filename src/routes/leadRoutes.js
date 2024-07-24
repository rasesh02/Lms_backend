import { Router } from "express";
import { registerLead } from "../controllers/Leads/leadsController.js";


const router=Router();
router.route("/register").post(registerLead);

export default router;