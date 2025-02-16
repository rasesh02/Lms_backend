import {asyncHandler} from "../../utils/asyncHandler.js";
import {ApiResponse} from "../../utils/ApiResponse.js";
import {ApiError} from "../../utils/ApiError.js"
import { Agent } from "../../models/Admin/agentModel.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { Lead } from "../../models/Leads/leadsModel.js";
import csv from "csvtojson";
import xlsx from "xlsx";

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

const logoutAgent=asyncHandler(async(req,res)=>{
    //console.log(req.agent._id);
    await Agent.findByIdAndUpdate(req.agent._id,
        {
           $unset:{refreshToken:1 } //remove field from document-> error for $set refreshToken: undefined
       },
        {new: true,}) 
       const options={
        httpOnly: true,
        secure: true,
        }
        return res.status(200).clearCookie("accessToken",options)
        .clearCookie("refreshToken",options).json(new ApiResponse(200,{},"Agent logged Out"))
})

const updateAgentDetails=asyncHandler(async(req,res)=>{
    const {fullName,address,company_name,phone_number,email}=req.body;
   if(!fullName || !address || !company_name || !phone_number || !email) return res.status(401).json({error: "All fields must be filled"});
    //console.log(req.agent._id);
    const agent=await Agent.findByIdAndUpdate(req.agent?._id,{
       $set:{
         fullName: fullName,
        address: address,
        company_name: company_name,
        phone_number: phone_number,
        email: email,
       }
    },{new: true}).select("-password");
    return res.status(200).json(new ApiResponse(200,agent,"Agent details updated successfully"));
})

const changeAgentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    if(!oldPassword || !newPassword) return res.status(400).json({error: "Invalid credentials"});
    const agent=await Agent.findById(req.agent._id);
    if(!agent) return res.status(500).json({error: "Server eror"});
    const hashedOldPassword= await bcrypt.compare(oldPassword,agent.password);
    if(oldPassword!==agent.password && !hashedOldPassword) return res.status(400).json({error: "Invalid Old Password"});
    const hashedNewPassword=await bcrypt.hash(newPassword,10);
    agent.password=hashedNewPassword;
    agent.save({validateBeforeSave:false});
    return res.status(200).json(new ApiResponse(200,{},"Agent details changed successfully"));
})

const getAllLeads=asyncHandler(async(req,res)=>{
    const agent=await Agent.findById(req.agent._id);
    const agentId= agent.agent_id;
   // console.log(agentId)
    if(!agentId) res.status(404).json({error: "Agent not found"});
    const allLeads =await Lead.find({agent_id: agentId}).select("-agent_id -agent_name");
    return res.status(200).json(new ApiResponse(200,allLeads,"all leads fetched"));
})

const sendMailtoLeads=asyncHandler(async(req,res)=>{
    const [leads]=req.body;
    const agent=await Agent.findById(req.agent._id);
    if(!agent) res.status(404).json({error: "Agent not found"});
    //console.log(allLeads);
  
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
        to: [leads],
        subject: "Agent wants to connect with you",   
        text: "Welcome to Customer Management System of Milleniance",
        html: `<b>Dear</b><br><b>Welcome to CMS of Milleniance</b><br>
        <p>Your registration was successful. Thank you for joining our service!</p>
        <b>Your Login Id = </b>  or <br><b>Your Login Password = </b>
        <p>Please find the attached download button with this email for downloading your desktop application.</p>
        <p>For any query do reply to this email</p><br>
        
        <p>Best Regards</p>
        <p>Head Office</p><p>Milleniance Softnet</p><p>New Ashok Nagar Delhi 110096 Near Metro Station Noida sector-18</p><p><b>Thank You</b></p> `, // html body
    })
   return res.status(200).json(new ApiResponse(200,{},"Mails sent"))
})

const addBulkLeadsCSV=asyncHandler(async(req,res)=>{
    let leads=[];

    csv().fromFile(req.file.path).then(async(response)=>{
      //  console.log(response);

        for(let i=0;i<response.length;i++){
            const existingLead=await Lead.findOne({email: response[i].email});
            //console.log(existingLead.email);
            if(existingLead) continue;
            const uniquesLeadId="MLMS_LEAD"+Math.floor(Math.random() * 100000).toString();
            const leadService=response.service;
            const agent=await Agent.findOne({
                service: leadService
            }).select({agent_id: 1, fullName: 1,email: 1});
            if(!agent) res.status(404).json({error: "Agent not found"});
            const leadAgentId= agent.agent_id;
            const leadAgentName= agent.fullName;
            leads.push({
                name: response[i].name,
                email: response[i].email,
                mobileNumber: response[i].mobileNumber,
                location: response[i].location,
                service: response[i].service,
                message: response[i].message,
                lead_id: uniquesLeadId,
                agent_id: leadAgentId,
                agent_name: leadAgentName,
                status: response[i].status,
                companyName: response[i].companyName,
            })
        
        }
       await Lead.insertMany(leads);
    })
    return res.status(200).json(new ApiResponse(200,{},"File uploaded"));
})
const addBulkLeadsExcel=asyncHandler(async(req,res)=>{
    
    let leads=[];
    let workbook=xlsx.readFile(req.file.path);
    let sheet=workbook.SheetNames;
    for(let i=0;i<sheet.length;i++){
        let res=xlsx.utils.sheet_to_json(workbook.Sheets[sheet[i]]);
        for(let j=0;j<res.length;j++){
        //console.log(res);
        let data=res[j];
        const existingLead=await Lead.findOne({email: data.email});
        if(existingLead) continue;
        const uniquesLeadId="MLMS_LEAD"+Math.floor(Math.random() * 100000).toString();
        const leadService=data.service;
        const agent=await Agent.findOne({
            service: leadService
        }).select({agent_id: 1, fullName: 1,email: 1});
        if(!agent) res.status(404).json({error: "Agent not found"});
        const leadAgentId= agent.agent_id;
        const leadAgentName= agent.fullName;
        leads.push({
            name: data.name,
            email: data.email,
            mobileNumber: data.mobileNumber,
            location: data.location,
            service: data.service,
            message: data.message,
            lead_id: uniquesLeadId,
            agent_id: leadAgentId,
            agent_name: leadAgentName,
            status: data.status,
            companyName: data.companyName,
        })
      }
    }
    await Lead.insertMany(leads);
    return res.status(200).json(new ApiResponse(200,{},"File uploaded"));
})

export {registerAgent,loginAgent,dummy,logoutAgent,updateAgentDetails,changeAgentPassword,getAllLeads,addBulkLeadsCSV,addBulkLeadsExcel,sendMailtoLeads};