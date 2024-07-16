import Db_connection from "./db/db_connection.js";
import dotenv from "dotenv"
import {app} from "./app.js" 
dotenv.config({
    path:"./env"
})

Db_connection().then(()=>{
    app.listen(process.env.PORT || 5000,()=>{
        console.log(`Listening to port at ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("Mongodb connection failed :",err)
});