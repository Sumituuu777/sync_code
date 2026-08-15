import express from "express"
import cors from "cors"
import {createServer} from "http"
import { Server } from "socket.io"
import {YSocketIO} from "y-socket.io/dist/server"

const app=express()
const server=createServer(app)


const PORT=process.env.PORT || 3000
server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
    
})