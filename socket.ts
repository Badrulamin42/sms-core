import 'reflect-metadata';
import express, { Application, Request, Response, Router } from 'express';
import { AppDataSource } from './config/ormconfig';
import cors from 'cors';
import authRouter from './auth/auth';
import userRouter from './user/UserApi';
import verifyToken from './middleware/authmiddleware';
import { Server } from 'socket.io';
import http from 'http';
import https from 'https';
import * as jwt from 'jsonwebtoken';
import userActivityUpdate from './middleware/userActitvyUpdate';
import { User } from './entity/User/user';
import camRouter from './user/CamApi';
import NotificationRouter from './notification/notificationApi';
import refferalRouter from './Refferal/refferalApi';
const clientTracker = require('./user/ClientTracker');  // Import the client tracker module
const fs = require('fs');
const INACTIVITY_TIMEOUT = 300000; // 5min
// const server = https.createServer(options,app);
const app: Application = express();
const port = process.env.PORT;
const server = http.createServer(app);
// Set max headers size (in bytes, default is 8KB)
const allowedOrigins:any = [
  process.env.REACT_APP_HMS, 
  "http://localhost:3000",
  'http://myserver.local:3000',
  'https//centoc.io',
];

interface UserConnection {
  socketId: string;
  lastActivity: number;
}

const connectedUsers: Record<string, UserConnection[]> = {};
// Create a proxy server
const options = {
  key: fs.readFileSync('cert/privkey.pem'),
  cert: fs.readFileSync('cert/fullchain.pem'),
};

server.maxHeadersCount = 1000; // Maximum number of headers to allow
server.maxRequestsPerSocket = 100;


app.use(
  cors({
    origin: (origin, callback) => {
      // console.log("Incoming request from:", origin); // Debugging log

      // ✅ Allow requests with no origin (Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(`🚫 Blocked CORS request from: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    credentials: true // Allow cookies/auth headers
  })
);
app.use(express.json());


const io : any = new Server(server, {
  cors: {
    origin: "*",
    // origin: allowedOrigins, // Frontend URL for CORS
    methods: ["GET", "POST"],
  }
});

(server as any).maxHeaderSize = 16 * 1024; // Set to 16 KB (default is 8 KB)
server.setTimeout(60000); // Set the timeout to 60 seconds


const onlineUsers = new Map();

io.on("connection", (socket: any) => {
  console.log(`New socket connection: ${socket.id}`);

  socket.on("authenticate", ({ token }: { token: string }) => {
    if (!token) {
      console.log("No token received.");
      socket.emit("logout", { message: "Authentication failed: No token provided" });
      return;
    }
  
    try {
      const decoded: any = jwt.verify(token, process.env.SKJWT as any);
      if (!decoded?.userId) {
        socket.emit("logout", { message: "Invalid or expired token" });
        return;
      }
      socket.userId = decoded.userId; 
      const userId = decoded.userId;
      onlineUsers.set(userId, { socketId: socket.id, username: decoded.userName });
  
      console.log(`${userId} is online: ${decoded.userName}`);
      
      // Send updated user list to all clients
      io.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({
        userId: id,
        username: data.username,
      })));
      console.log("Updated users list:", Array.from(onlineUsers.values()));
      // Notify the authenticated user
      socket.emit("authenticated", { message: "Authentication successful" });
  
    } catch (error) {
      console.error("Token verification failed:", error);
      socket.emit("logout", { message: "Invalid token" });
    }
  });
  
  socket.on("forceLogout", () => {
    if (!socket.userId) return;
  
    console.log(`User ${socket.userId} is logging out.`);
    
    if (onlineUsers.has(socket.userId)) {
      io.to(socket.id).emit("logout", { message: "You have been logged out due to inactivity" });
      onlineUsers.delete(socket.userId);
    }
  
    delete connectedUsers[socket.userId];
  
    console.log("Updated users list:", Array.from(onlineUsers.values()));
    io.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({ userId: id, username: data.username })));
  
    socket.disconnect(true); // Ensure full disconnection
  });
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    console.log(`Socket disconnected: ${socket.userId}`);
    if (!socket.userId) return;
    const userId = socket.userId;
  
    delete connectedUsers[userId];
    onlineUsers.delete(userId);
  
    io.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({ userId: id, username: data.username })));
  });


  socket.on("getOnlineUsers", () => {
    socket.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({
      userId: id,
      username: data.username,
    })));
  });

  socket.on("sendMessage", ({ senderId, receiverId, text } :any) => {
   
    const receiverSocketId = onlineUsers.get(receiverId)?.socketId; // Find receiver's socket ID
    
    console.log('senderId :',senderId)
    console.log('receiverId :',receiverId)
    console.log('receiverSocketId :',receiverSocketId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", { senderId, text });
    } else {
      console.log("Receiver is offline.");
    }
  });
});

// Periodic check for inactivity (for automatic logout)
setInterval(async () => {
  for (const username in connectedUsers) {
    console.log(`User ${username} interval ${clientTracker.getActiveClients()}`);
    
    const userConnections = connectedUsers[username]; // Array of connections
    const userRepository = AppDataSource.getRepository(User);

    // Fetch user details from the database
    const userobj:any = await userRepository.findOne({ where: { id: username } });
    if (!userobj) {
      console.log(`User ${username} not found in the database`);
      continue;
    }

    const now = new Date().getTime(); // Current time in milliseconds
    const lastActivityTime = new Date(userobj.lastActivity).getTime(); // Convert lastActivity to milliseconds

    if (now - lastActivityTime > INACTIVITY_TIMEOUT) {
      // User has been inactive for more than the timeout threshold

      userConnections.forEach((connection:any) => {
        // Emit logout event to each socket
        io.to(connection.socketId).emit("logout", {
          message: "You have been logged out due to inactivity",
        });
        console.log(
          `User ${username} with socket ${connection.socketId} has been logged out due to inactivity`
        );
      });

      // Remove the user from connectedUsers
      delete connectedUsers[username];
    }
  }
}, 60000); // Check every minute

export {app, server, port,  io,}