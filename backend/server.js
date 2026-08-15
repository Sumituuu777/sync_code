import express from "express"
import cors from "cors"
import {createServer} from "http"
import { Server } from "socket.io"
import {YSocketIO} from "y-socket.io/dist/server"

const app=express()
const server=createServer(app)

const io=new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
    }
})

const ySocketIO=new YSocketIO(io)
ySocketIO.initialize()

// check routes
app.get("/",(req,res)=>{
    res.status(200).json({
        message:"Hello",
        success:true
    })
})

const PORT=process.env.PORT || 3000
server.listen(PORT,()=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
    
})