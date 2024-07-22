import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {ApiError} from "../../utils/ApiError.js"
import { Agent } from "../../models/Admin/agentModel.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

const generateAccessandRefreshTokens=async(agentId)=>{
    try{
       const agent=await Agent.findById(agentId);
       const accessToken=agent.generateAccessToken();
       const refreshToken=agent.generateRefreshToken();
       agent.refreshToken=refreshToken;
       await agent.save({validateBeforeSave:false});
       return {accessToken,refreshToken};
    }
    catch(err){
        console.log(err);
        throw new ApiError(500,"Some problem while generating agent's access and refresh token")
    }
}


const registerAgent=asyncHandler(async(req,res)=>{
    const {fullName,address,company_name,phone_number,email,password}=req.body;
    if(!email || !phone_number || !company_name || !password) throw new ApiError(400,"Registration credentials are not complete");
    const existingAgent=await Agent.findOne({email});
    if(existingAgent) throw new ApiError(400,"Agent already exists.Please login");
    const uniqueAgentId="M_NMS"+Math.floor(Math.random() * 100000).toString();
    const hashedPassword=await bcrypt.hash(password,10);
    const newAgent= await Agent.create({
        fullName,
        agent_id:uniqueAgentId,
        address,
        company_name,
        phone_number,
        email,
        password:hashedPassword,
    });
    let testAccount=await nodemailer.createTestAccount();
    let transporter=nodemailer.createTransport({
        service: "gmail",
        auth:{
            user: "sushrutpandey1@gmail.com",
            pass: "jucopocadqdwpvll",
        }
    });
    let info=await transporter.sendMail({
        from:"sushrutpandey1@gmail.com",
        to: email,
        subject: "Registration Confirmed On M_CMS",   
        text: "Welcome to Customer Management System of Milleniance",
        html: `<b>Dear ${fullName}</b><br><b>Welcome to CMS of Milleniance</b><br>
        <p>Your registration was successful. Thank you for joining our service!</p>
        <b>Your Login Id = </b> ${email} or ${uniqueAgentId}<br><b>Your Login Password = </b>${password}
        <p>Please find the attached download button with this email for downloading your desktop application.</p>
        <p>For any query do reply to this email</p><br>
        
        <p>Best Regards</p>
        <p>Head Office</p><p>Milleniance Softnet</p><p>New Ashok Nagar Delhi 110096 Near Metro Station Noida sector-18</p><p><b>Thank You</b></p> `, // html body
    })

    const createdAgent=await Agent.findById(newAgent._id).select("-password -agent_id");
    if(!createdAgent) throw new ApiError(500,"Some error occured while registration of agent")
    return res.status(200).json(new ApiResponse(200,createdAgent,"Agent registration succesfull"));
})

const loginAgent=asyncHandler(async(req,res)=>{
    const {id,password}=req.body;
    if(!id && !password) throw new ApiError(400,"Login credentials incomplete");
    const agent=await Agent.findOne({
        $or: [{email: id},{agent_id: id}]
    })
    if(!agent) throw new ApiError(400,"Agent does not exists");
    const isPasswordValid=await agent.isPasswordCorrect(password);
    if(!isPasswordValid) throw new ApiError(400,"Incorrect Password");
    const {accessToken,refreshToken}=await generateAccessandRefreshTokens(agent._id);
    const loggedInAgent=await Agent.findById(agent._id).select("-password -refreshToken")
    const options={
        httpOnly: true,
        secure: true,
    }
    res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
    .json(
       new ApiResponse(200,
        {
            agent: loggedInAgent,accessToken,refreshToken
        },
        "Agent successfully loggedIn"
       )
    )
}) 
const dummy=asyncHandler(async(req,res)=>{
    console.log("hi");
    return res.status(200).json(new ApiResponse(200,"Hello"));
})




export {registerAgent,loginAgent,dummy};