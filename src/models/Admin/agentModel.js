import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
const agentSchema= new Schema({
   fullName:{
    type: String,
    required: true,
   },
   agent_id:{
     type: String,
     required: true,
     unique: true,
   },
   address:{
       type: String,
       required: true,
   },
   company_name:{
    type: String,
    required: true,
   },
   phone_number:{
      type: String,
      required: true,
   },
   email:{
    type: String,
    required: true,
    unique: true,
    lowecase: true,
    trim: true, 
   },
   password:{
    type: String,
    required: [true, 'Password is required'],
   },
   service:{
    type: String,
    required: true,
   }
},{timestamps: true})

agentSchema.methods.isPasswordCorrect=async function(password){
   return await bcrypt.compare(password,this.password);
}

agentSchema.methods.generateAccessToken=function(){
    return  jwt.sign({
        _id:this._id,
        email: this.email,
        fullName:this.fullName,
        agent_id:this.agent_id
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

agentSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}


export const Agent=mongoose.model("Agent",agentSchema);