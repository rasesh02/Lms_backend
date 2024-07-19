import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {ApiError} from "../../utils/ApiError.js"
import { Admin } from "../../models/Admin/Admin.model.js";
import bcrypt from "bcrypt";
import { Agent } from "../../models/Admin/agentModel.js";

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

const registerAdmin=asyncHandler(async(req,res)=>{
    const {name,email,password}=req.body;
    if(!email || !name || !password) throw new ApiError(400,"Admin registration credentials are not complete");
    const existingAdmin=await Admin.findOne({email});
    if(existingAdmin) throw new ApiError(400,"Admin already exists.Please login");
    const uniqueAdminId="MLMS_ADMIN"+Math.floor(Math.random() * 100000).toString();
    const hashedPassword=await bcrypt.hash(password,10);
    const newAdmin= await Admin.create({
        name,
        admin_id:uniqueAdminId,
        email,
        password:hashedPassword,
    });
    const createdAdmin=await Admin.findById(newAdmin._id).select("-password -admin_id");
    if(!createdAdmin) throw new ApiError(500,"Some error occured while registration of admin")
    return res.status(200).json(new ApiResponse(200,createdAdmin,"Admin registration succesfull"));
})

const loginAdmin= asyncHandler(async(req,res)=>{
   const {email,admin_id,password}=req.body;
   if(!email  && !admin_id) throw new ApiError(400,"Invalid credentials");
   const admin= await Admin.findOne({
    $or:[{admin_id},{email}]
   });
  if(!admin) throw new ApiError(400,"Admin does not exist");
  const hashedPassword=await bcrypt.compare(password, admin.password);
  console.log(hashedPassword);
  if(!hashedPassword  && admin.password!==password) throw new ApiError(401,"incorrect password");

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

const updateAdminProfile=asyncHandler(async(req,res)=>{
    const {name,email}=req.body;
    if(!name || !email) throw new ApiError(400,"Invalid name or email");
    const updatedAdmin=await Admin.findByIdAndUpdate(req.admin?._id,{
        $set:{
            name:name,
            email:email,
        }
    },{new:true}).select("-password")
    return res.status(200).json(new ApiResponse(200,updatedAdmin,"Admin Profile Updated Successfully"));
})

const changePassword=asyncHandler(async(req,res)=>{
    //verify old password
    //save new password
    /*
    const {oldPassword,newPassword,admin_id}=req.body;
    const admin=await Admin.findOne({admin_id});
    //console.log(admin.password);
    const currhashedPassword=await admin.isPasswordCorrect(oldPassword);
    console.log(currhashedPassword);
  //  console.log(currhashedPassword);
   if(!currhashedPassword && admin.password!==oldPassword)  throw new ApiError(400,"Admin has entered wrong old password");
    const newHashedPassword=await bcrypt.hash(newPassword,10);
    */
   const {admin_id,newPassword}=req.body;
    if(newPassword.trim()==="") throw new ApiError(400,"enter valid password");
    const admin=await Admin.findOne({admin_id});
    const newHashedPassword=await bcrypt.hash(newPassword,10);
    admin.password=newHashedPassword;
   await admin.save({validateBeforeSave: false});
   return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})

const getAllAgents=asyncHandler(async(req,res)=>{
    const allAgents=await Agent.find();
    return res.status(200).json(new ApiResponse(200,allAgents,"All agents of the admin were fetched"));
})

const deleteAgent=asyncHandler(async(req,res)=>{
    const {agentId}=req.params;
    if(!agentId) throw new ApiError(401,"Agent does not exist");
    console.log(agentId);
    await Agent.findByIdAndDelete(agentId);
    return res.status(200).json(new ApiResponse(200,{},"Agent deleted successfully"));
})

const updateAgent=asyncHandler(async(req,res)=>{
    const {agentId}=req.params;
    if(!agentId) throw new ApiError(401,"Agent does not exist");
    const {fullName,address,company_name,phone_number,email}=req.body;
    if(!email || !phone_number || !company_name ) throw new ApiError(400,"add valid update credentials");
    const updatedAgent=await Agent.findByIdAndUpdate(agentId,{
        $set:{
            fullName: fullName,
            address: address,
            company_name: company_name,
            phone_number: phone_number,
            email:email,
        }
    },{new:true})
    return res.status(200).json(new ApiResponse(200,updatedAgent,"agent details updated by admin"));
})

const logoutAdmin=asyncHandler(async(req,res)=>{
    await Admin.findByIdAndUpdate(req.admin._id,{
        $unset:{refreshToken:1}
    },{new: true});
    const options={
        httpOnly: true,
        secure: true,
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
           .json(new ApiResponse(200,{},"Admin logged out successfully"))
})

export {registerAdmin,loginAdmin,logoutAdmin,changePassword,updateAdminProfile,getAllAgents,deleteAgent,updateAgent};
