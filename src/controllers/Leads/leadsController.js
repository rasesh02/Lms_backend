import {asyncHandler} from "../../utils/asyncHandler.js"
import {ApiError} from "../../utils/ApiError.js";
import {ApiResponse} from "../../utils/ApiResponse.js"
import { Lead } from "../../models/Leads/leadsModel.js";
import { Agent } from "../../models/Admin/agentModel.js";
import nodemailer from "nodemailer";


const registerLead=asyncHandler(async(req,res)=>{
    const {name,email,mobileNumber,location,service,message,status,followUpDate,companyName}=req.body;
    if(!email || !service || !name  || !mobileNumber) res.status(400).json({error: "Please fill all required fields"});
    const uniquesLeadId="MLMS_LEAD"+Math.floor(Math.random() * 100000).toString();
    const leadService= service;
    const agent=await Agent.findOne({
        service: leadService
    }).select({agent_id: 1, fullName: 1,email: 1});
   // console.log(agent);
    if(!agent) res.status(500).json({error: "Internal Error "});
   // console.log(agent.fullName);
    const leadAgentId= agent.agent_id;
    //console.log(leadAgentId);
    const leadAgentName= agent.fullName;
    const newLead= await Lead.create({
        name,
        email,
        mobileNumber,
        location,
        service,
        message,
        status,
        followUpDate,
        companyName,
        lead_id: uniquesLeadId,
        agent_id: leadAgentId,
        agent_name: leadAgentName,
    });

    await nodemailer.createTestAccount();
    let transporter=nodemailer.createTransport({
        service: "gmail",
        auth:{
            user: "sushrutpandey1@gmail.com",
            pass: "jucopocadqdwpvll",
        }
    });
    await transporter.sendMail({
        from:"sushrutpandey1@gmail.com",
        to: email,
        subject: "Registration Confirmed On M_CMS",   
        text: "Welcome to Customer Management System of Milleniance",
        html: `<b>Dear ${name}</b><br><b>Welcome to CMS of Milleniance</b><br>
        <p>Your registration was successful. Thank you for joining our service!</p>
        <b>Your Application Id = </b> ${uniquesLeadId} <br>
        <p>Please find the attached download button with this email for downloading your desktop application.</p>
        <p>For any query do reply to this email</p><br>
        <p>Best Regards</p>
        <p>Head Office</p><p>Milleniance Softnet</p><p>New Ashok Nagar Delhi 110096 Near Metro Station Noida sector-18</p><p><b>Thank You</b></p> `, // html body
    })
   
    await transporter.sendMail({
        from:"sushrutpandey1@gmail.com",
        to: agent.email,
        subject: "Lead Registration ",   
        text: "Your Lead is registered successfully",
        html: `<b>Dear ${leadAgentName}</b><br>
        <p>Your lead registration was successful.Lead name is ${name}</p>
        <p>and lead id is ${uniquesLeadId} </p>Your time starts now.<br>
        <p>Best Regards</p>
        <p>Head Office</p><p>Milleniance Softnet</p><p>New Ashok Nagar Delhi 110096 Near Metro Station Noida sector-18</p><p><b>Thank You</b></p> `, // html body
    })
    res.status(200).json(new ApiResponse(200,{},"Lead added successfully"));
    
})

export {registerLead};