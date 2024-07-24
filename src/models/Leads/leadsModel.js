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
    },
    service:{
        type: String,
       required:true,
    },
    message:{
       type: String,
    },
    agent_name:{
        type: String,
        required: true,
    },
    agent_id:{
       type: String,
       required: true,
    }
})

export const Lead= mongoose.model("Lead",leadSchema);