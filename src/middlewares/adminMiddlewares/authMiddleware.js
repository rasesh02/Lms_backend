import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Admin } from "../../models/Admin/Admin.model.js";


export const verifyAdminJWT=asyncHandler(async(req,res,next)=>{
    try{
       const token=req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ","");
       if(!token) throw new ApiError(401,"Unauthorized request");
       const decodeToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
       const admin=await Admin.findById(decodeToken?._id).select("-password -refreshToken");
       if(!admin) throw new ApiError(401,"Invalid Access Token");
       req.admin=admin;
       next();
    }
    catch(err){
        throw new ApiError(401,`User must be logged in / invalid accesstoken. Error is: ${err?.message}`||"Invalid Access Token")
    }
})