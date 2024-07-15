import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin/Admin.model.js";


export const verifyJWT=asyncHandler(async(req,res,next)=>{
    try {
      // user cookie will have access token or for mobile user cookies will not be there, so accesstoken will be present in header
      const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
      if(!token) throw new ApiError(401,"Unauthorized request");
      
      const decodeToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
      //in user.model generateAccessToken. Our access token has ._id
      const user=await Admin.findById(decodeToken?._id).select("-password -refreshToken")
      if(!user) throw new ApiError(401,"Invalid Access Token")
      //like .send,.body, we make our own method as .user
      req.user=user;
      next()
    } catch (error) {
       throw new ApiError(401,error?.message||"Invalid Access Token")
    }
 })