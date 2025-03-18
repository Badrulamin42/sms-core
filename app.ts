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



const axios = require('axios');
const fs = require('fs');
const ipcam01 = '192.168.0.7'
const ESP32_CAM_STREAM_URL = `http://192.168.0.7/stream`;
const { exec } = require('child_process');
const app: Application = express();
const port = process.env.PORT;
const ffmpeg = require('fluent-ffmpeg');
// Set body parser limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const clientTracker = require('./user/ClientTracker');  // Import the client tracker module



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
// SSL_CERT=cert/rootCA.pem
// SSL_KEY=cert/rootCA-key.pem
const allowedOrigins:any = [
  process.env.REACT_APP_HMS, 
  "http://localhost:3000",
  'http://myserver.local:3000',
  'https//centoc.io',
];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (like mobile apps or Postman)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }
//       // If the origin is not in the list, block the request
//       console.log(`Blocked CORS request from: ${origin}`);
//       return callback(new Error("Not allowed by CORS"));
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
//     credentials: true, // Allow cookies/auth headers
//   })
// );
app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Incoming request from:", origin); // Debugging log

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
const INACTIVITY_TIMEOUT = 300000; // 5min
// const server = https.createServer(options,app);
const server = http.createServer(app);
// Set max headers size (in bytes, default is 8KB)
server.maxHeadersCount = 1000; // Maximum number of headers to allow
server.maxRequestsPerSocket = 100;

const io : any = new Server(server, {
  cors: {
    origin: "*",
    // origin: allowedOrigins, // Frontend URL for CORS
    methods: ["GET", "POST"],
  }
});

(server as any).maxHeaderSize = 16 * 1024; // Set to 16 KB (default is 8 KB)
server.setTimeout(60000); // Set the timeout to 60 seconds

// Verify JWT middleware
const verifyJWT = (token:any) => {
  try {
    return jwt.verify(token, process.env.SKJWT as any);
  } catch (err) {
    return null;
  }
};
const onlineUsers = new Map();

io.on("connection", (socket: any) => {
  console.log(`New socket connection: ${socket.id}`);

  socket.on("authenticate", (token: any) => {
    try {
      const decoded: any = verifyJWT(token);
      console.log("User connected:", decoded);
  
      if (!decoded || !decoded.userId) {
        socket.emit("logout", { message: "Invalid or expired token" });
        return;
      }
      

      const userId = decoded.userId;
      const wasUserAlreadyConnected = connectedUsers[userId]?.length > 0;
     
       socket.userId = userId; // Attach userId to socket
      // **Disconnect all previous sockets for this user before assigning a new one**

       // Store the user's socket ID
       onlineUsers.set(userId, { socketId: socket.id, username: decoded.userName }); // Assuming username exists
       console.log(`${userId} is online: ${decoded.userName}`);
       console.log("Emitting updated users list:", Array.from(onlineUsers.values()));
       // Send the updated user list to all clients
       io.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({ userId: id, username: data.username })));
 // Also send the list **only to the newly connected user**
    socket.emit("onlineUsers", Array.from(onlineUsers, ([id, data]) => ({
      userId: id,
      username: data.username,
    })));
      if (connectedUsers[userId]) {
        connectedUsers[userId].forEach(({ socketId }) => {
          if (io.sockets.sockets.get(socketId)) {
            io.sockets.sockets.get(socketId).disconnect(true);
          }
        });
      }
  
      // **Reset connections before adding a new one**
      connectedUsers[userId] = [{ socketId: socket.id, lastActivity: Date.now() }];
  
      // **Only increment active clients if this is a fresh login**
      if (!wasUserAlreadyConnected) {
        clientTracker.increment();
      }
  
      console.log(
        `${userId} authenticated with socket ID: ${socket.id}, last activity at ${Date.now()}, active clients: ${clientTracker.getActiveClients()}`
      );
  
      socket.emit("authenticated", { message: "Authentication successful" });
  
    } catch (error) {
      console.error("Token verification failed:", error);
      socket.emit("logout", { message: "Invalid token" });
    }
  });
  
  socket.on("forceLogout", () => {
    console.log(`User ${socket.userId} is logging out.`);
    
    if (socket.userId && onlineUsers.has(socket.userId)) {
      const userSocketId = onlineUsers.get(socket.userId).socketId; // Get the socket ID
      io.to(userSocketId).emit("logout", {
        message: "You have been logged out due to inactivity",
      });
      console.log(`Removing user ${socket.userId} immediately due to logout`);
      delete connectedUsers[socket.userId];
      onlineUsers.delete(socket.userId);
      clientTracker.decrement();
      console.log(" updated users list:", Array.from(onlineUsers.values()));
      io.emit(
        "onlineUsers",
        Array.from(onlineUsers, ([id, data]) => ({ userId: id, username: data.username }))
      );
    }
    
    socket.disconnect(true); // Ensure full disconnection
  });
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    if (!socket.userId) return; // Ensure there's a valid userId
    
    const userId = socket.userId;
    const socketWasRemoved = connectedUsers[userId]?.some(({ socketId }) => socketId === socket.id);
    
    if (socketWasRemoved) {
      connectedUsers[userId] = connectedUsers[userId].filter(({ socketId }) => socketId !== socket.id);
    }
    
    if (connectedUsers[userId]?.length === 0) {
      console.log(`User ${userId} disconnected, waiting for reconnection...`);
      
      setTimeout(() => {
        if (!connectedUsers[userId] || connectedUsers[userId].length === 0) {
          console.log(`Removing user ${userId} from onlineUsers after timeout`);
          delete connectedUsers[userId];
          onlineUsers.delete(userId);
          clientTracker.decrement();
    
          io.emit(
            "onlineUsers",
            Array.from(onlineUsers, ([id, data]) => ({ userId: id, username: data.username }))
          );
        }
      }, 3000); // Wait 5 seconds before fully removing
    }
    
    console.log(`Active clients after disconnect: ${clientTracker.getActiveClients()}`);
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



AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized.');

    // Public routes
    app.use('/api/auth', authRouter);
    app.use('/api/refferal', refferalRouter);
    app.use('/api/notification', NotificationRouter);
    // Protected route with JWT authentication
    app.use('/api/user', verifyToken, userRouter);
    app.use(userActivityUpdate)
    app.use('/api/cam', camRouter);
    
  
    server.listen(port, () => {
      console.log(`Server running at ${process.env.DB_HOST}:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

  export { 
    io,
   
  };