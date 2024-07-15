import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const adminSchema= new Schema({
    admin_id:{
        type: Number,
        required: true,
        unique: true,
    },
    name:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, 
        index: true
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
        required: [true, 'Password is required']
    }
},{timestamps:true});


adminSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();
    this.password= await bcrypt.hash(this.password,10); //here 10 is no.of round of encrytion, can we any no.
    next()
 })
 adminSchema.methods.isPasswordCorrect=async function(password){
   return await bcrypt.compare(password,this.password)
 }
 adminSchema.methods.generateAccessToken=function(){
     return  jwt.sign({
         _id:this._id,
         email: this.email,
         name:this.name,
         admin_id:this.admin_id
     },
     process.env.ACCESS_TOKEN_SECRET,
     {
         expiresIn: process.env.ACCESS_TOKEN_EXPIRY
     })
 }
 
 adminSchema.methods.generateRefreshToken=function(){
     return jwt.sign({
         _id:this._id,
     },
     process.env.REFRESH_TOKEN_SECRET,
     {
         expiresIn: process.env.REFRESH_TOKEN_EXPIRY
     })
 }

export const Admin= mongoose.model("Admin",adminSchema);
