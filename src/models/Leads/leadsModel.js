import mongoose,{Schema} from "mongoose";

const leadSchema=new Schema({
    name:{
        type: String,
        required:true,
    },
    email:{
       type: String,
       required:true,
       unique: true,
    },
    lead_id:{
      type: String,
      required:true,
      unique: true,
    },
    mobileNumber:{
        type: String,
       required:true,
    },
    location:{
        type: String,
        required: true,
        default: NaN,
    },
    service:{
        type: String,
       required:true,
    },
    message:{
       type: String,
       required: true,
       default: NaN,
    },
    agent_name:{
        type: String,
        required: true,
    },
    agent_id:{
       type: String,
       required: true,
    },
    status:{
        type: String,
        required: true,
        default: "Active",
        enum:["Proposal Sent","Meeting Fixed","Spoke","Active","Converted to Opportunity"]
    },
    companyName:{
        type: String,
        required: true,
        default: NaN,
    },
    followUpDate: {
        type: String,
        required: true,
        default: Date.now,
    }
},{timestamps: true});

export const Lead= mongoose.model("Lead",leadSchema);