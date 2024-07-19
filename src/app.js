import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit:"32kb"}))
app.use(express.urlencoded({extended:true,limit:"32kb"}));
app.use(express.static("public"));
app.use(cookieParser())

import adminRouter from "../src/routes/admin.routes.js";
import agentRouter from "../src/routes/agentRoutes.js";
app.use("/api/v1/admin",adminRouter);
app.use("/api/v1/agent",agentRouter);

export {app};