import {Router} from "express";
import { loginAdmin} from "../controllers/Admin/admin.controller.js";
//import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/login").post(loginAdmin);

export default router;