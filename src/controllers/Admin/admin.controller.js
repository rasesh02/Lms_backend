import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {ApiError} from "../../utils/ApiError.js"
import { Admin } from "../../models/Admin/Admin.model.js";


const generateAccessandRefreshTokens=async(adminId)=>{
    try{
       const admin=await Admin.findById(adminId);
       const accessToken=admin.generateAccessToken();
       const refreshToken=admin.generateRefreshToken();
       admin.refreshToken=refreshToken;
       await admin.save({validateBeforeSave:false});
       return {accessToken,refreshToken}
    }
    catch(err){
        console.log(err);
        throw new ApiError(500,"Error while generating access or refresh token")
    }
}

const loginAdmin= asyncHandler(async(req,res)=>{
   const {email,admin_id,password}=req.body;
   if(!email  && !admin_id) throw new ApiError(400,"Invalid credentials");
   const admin=await Admin.findOne({
    $or:[{admin_id},{email}]
   });
  if(!admin) throw new ApiError(400,"Admin does not exist");
  if(password!=admin.password) throw new ApiError(401,"incorrect password")
  const {accessToken,refreshToken}= await generateAccessandRefreshTokens(admin._id);
  const loggedInAdmin=await Admin.findById(admin._id).select("-password -refreshToken")
  const options={
      httpOnly: true,
      secure: true,
  }
  res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
  .json(
     new ApiResponse(200,
      {
          admin: loggedInAdmin,accessToken,refreshToken
      },
      "Admin successfully loggedIn"
     )
  )
})

export {generateAccessandRefreshTokens,loginAdmin};
