import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {ApiError} from "../../utils/ApiError.js"
import { Admin } from "../../models/Admin/Admin.model.js";
import bcrypt from "bcrypt";
import { Agent } from "../../models/Admin/agentModel.js";
import nodemailer from "nodemailer";
import { Lead } from "../../models/Leads/leadsModel.js";

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
   const {id,password}=req.body;
   if(!id  && !password) throw new ApiError(400,"Invalid credentials");
   const admin= await Admin.findOne({
    $or:[{admin_id:id},{email: id}]
   });
  if(!admin) throw new ApiError(400,"Admin does not exist","Incorrect id");
  const hashedPassword=await bcrypt.compare(password, admin.password);
  console.log(hashedPassword);
  if(!hashedPassword  && admin.password!==password) res.status(404).json({error: "Admin not found"});

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
    const {oldPassword,newPassword,admin_id}=req.body;
    const admin=await Admin.findOne({admin_id});
    //console.log(admin.password);
    const currhashedPassword=await admin.isPasswordCorrect(oldPassword);
    console.log(currhashedPassword);
  //  console.log(currhashedPassword);
   if(!currhashedPassword && admin.password!==oldPassword)  throw new ApiError(400,"Admin has entered wrong old password");
    const newHashedPassword=await bcrypt.hash(newPassword,10);
    admin.password=newHashedPassword;
   await admin.save({validateBeforeSave: false});

   
   await nodemailer.createTestAccount();
   let transporter=nodemailer.createTransport({
       service: "gmail",
       auth:{
           user: "sushrutpandey1@gmail.com",
           pass: "jucopocadqdwpvll",
       }
   });
   let info=await transporter.sendMail({
       from:"sushrutpandey1@gmail.com",
       to: admin.email,
       subject: "Password has been changed at Milleniance LMS",   
       text: "Dear Admin you have your password has been changed successfully",
       html: ` <p>Hey ${admin.name}! </p><br>
       <p>You have recently changed your password</p>
       <b>Your new password is ${newPassword}.<br>
       <p>Thank you for visiting Milleniance</p><br>
       <p>Best Regards</p>
       <p>Head Office</p><p>Milleniance Softnet</p><p>New Ashok Nagar Delhi 110096 Near Metro Station Noida sector-18</p><p><b>Thank You</b></p> `, // html body
   })
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

const getAllLeads=asyncHandler(async(req,res)=>{
    const admin=await Admin.findById(req.admin._id);
    if(!admin) res.status(404).json({error: "User not found"});
    const allLeads=await Lead.find();
    return res.status(200).json(new ApiResponse(200,allLeads,"All Leads fetched"));
})

export {registerAdmin,loginAdmin,logoutAdmin,changePassword,updateAdminProfile,getAllAgents,deleteAgent,updateAgent,getAllLeads};
