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
import { In } from 'typeorm';
import { Message } from './entity/chat';
const clientTracker = require('./user/ClientTracker');  // Import the client tracker module
const { sendPushNotification,sendPushNotificationToAll } = require("./notification/notificationController");
const fs = require('fs');
const INACTIVITY_TIMEOUT = 86400000 //24h 
// 300000; // 5min
const { v4: uuidv4 } = require('uuid');
const app: Application = express();
const port = process.env.PORT;

// Set max headers size (in bytes, default is 8KB)
const allowedOrigins:any = [
  process.env.REACT_APP_HMS, 
  "http://192.168.0.193:3000",
  "http://localhost:3000",
  'https//centoc.io',
];

// Create a proxy server
const options = {
  key: fs.readFileSync('cert/privkey.pem'),
  cert: fs.readFileSync('cert/fullchain.pem'),
};
// const server = https.createServer(options,app);
const server = http.createServer(app);

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
const userActivity = new Map(); // Maps userId to { socketId, currentChatId }

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
      const existingUser = onlineUsers.get(userId);
      if (existingUser) {
        existingUser.socketIds.push(socket.id);
      } else {
        onlineUsers.set(userId, { socketIds: [socket.id], username: decoded.userName });
      }

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
  
    console.log("Updated users list:", Array.from(onlineUsers.values()));
    io.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({ userId: id, username: data.username })));
  
    socket.disconnect(true); // Ensure full disconnection
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    console.log(`Socket disconnected: ${socket.userId}`);
    if (!socket.userId) return;
    const userId = socket.userId;
  
    onlineUsers.delete(userId);
    for (const [userId, userInfo] of userActivity.entries()) {
      if (userInfo.socketId === socket.id) {
        userActivity.delete(userId);
        console.log(`❌ User ${userId} disconnected`);
      }
    }
  
    io.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({ userId: id, username: data.username })));
  });


  socket.on("getOnlineUsers", () => {
    socket.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({
      userId: id,
      username: data.username,
    })));
  });

  socket.on("joinChat", ({ userId, chatId }: any) => {
    userActivity.set(userId, {
      socketId: socket.id,
      currentChatId: chatId,
      isBackground: false, // Default as active
    });
  });
  
  socket.on("leaveChat", ({ userId }: any) => {
    if (userActivity.has(userId)) {
      userActivity.set(userId, {
        ...userActivity.get(userId)!,
        currentChatId: null,
      });
    }
  });
  
  socket.on("userActive", ({ userId }: any) => {
    if (userActivity.has(userId)) {
      userActivity.set(userId, {
        ...userActivity.get(userId)!,
        isBackground: false,
      });
      console.log(`🟢 User ${userId} is active`);
    }
  });
  
  socket.on("userBackground", ({ userId }: any) => {
    if (userActivity.has(userId)) {
      userActivity.set(userId, {
        ...userActivity.get(userId)!,
        isBackground: true,
      });
      console.log(`🟡 User ${userId} is in background`);
    }
  });


socket.on("sendMessage", async ({ senderId, receiverId, text }: any) => {
  const messageRepository = AppDataSource.getRepository(Message);

  const newMessage = messageRepository.create({
    sender_id: senderId,
    receiver_id: receiverId,
    text,
  });

  await messageRepository.save(newMessage);

  const receiverSocketId = await onlineUsers.get(receiverId)?.socketIds;
  const activity = userActivity.get(receiverId);



  if (receiverSocketId) {
   
    const user:any = await AppDataSource.getRepository(User).findOneBy({id : receiverId})
    console.log('receiverId',receiverId,user.fcmtoken);
    const senderuser:any = await AppDataSource.getRepository(User).findOneBy({id :senderId})
    
    console.log(`📤 Sending message to ${receiverId} at ${receiverSocketId}`);
    io.to(receiverSocketId).emit("receiveMessage", {
      id: newMessage.id,
      senderId,
      receiverId,
      text,
      timestamp: newMessage.timestamp,
      is_read: newMessage.is_read,
    });
    const result:any = {
      token : user.fcmtoken,
      title : 'New message from '+senderuser.name,
      body : text
    }
console.log(activity,'activity')
    if (activity?.currentChatId == null) {
      await sendPushNotification(result.token, result.title, result.body);
    }
   

  } else {
    console.log(`📥 Message saved for offline user: ${receiverId}`);
  }
});


  socket.on("markAsRead", async ({ messageId } : any) => {
    const messageRepository = AppDataSource.getRepository(Message);
    await messageRepository.update({ id: messageId }, { is_read: true });
  });

});

// Periodic check for inactivity (for automatic logout)
setInterval(async () => {
  console.log(`Checking for inactive users...`);

  const userRepository = AppDataSource.getRepository(User);
  const now = Date.now();

  // Fetch all active users from database
  const allUsers:any = await userRepository.find({
    where: { id: In([...onlineUsers.keys()]) }, // Fetch only users currently online
    select: ["id", "lastActivity"], // Fetch only necessary fields
  });
  console.log(allUsers,'allUsers')
  for (const user of allUsers) {
    const lastActivityTime = new Date(user?.lastActivity).getTime();

    if (now - lastActivityTime > INACTIVITY_TIMEOUT) {
      // User is inactive
      const userConnections = onlineUsers.get(user.id)?.socketIds || [];
      console.log(userConnections,'userConnections2')
      userConnections.forEach((socketId: string) => {
        console.log(socketId,'socketId')
        io.to(socketId).emit("logout", {
          message: "You have been logged out due to inactivity",
        });
        console.log(`User ${user.id} (Socket: ${socketId}) logged out due to inactivity`);
      });

      // Remove user from online users list
      onlineUsers.delete(user.id);
    
      console.log(`User ${user.id} removed from onlineUsers.`);
    }
  }

  // Broadcast updated online users list
  io.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({ userId: id, username: data.username })));
}, 60000); // Run every minute



export { app, server, port, io, AppDataSource, };