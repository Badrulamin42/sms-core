import 'reflect-metadata';
import express, { Request, Response, Router } from 'express';
import { AppDataSource } from './config/ormconfig';
import cors from 'cors';
import authRouter from './auth/auth';
import userlist from './user/userlist';
import verifyToken from './middleware/authmiddleware';
import { Server } from 'socket.io';
import http from 'http';
import * as jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT;

app.use(cors()); // Enable CORS
app.use(express.json());
const INACTIVITY_TIMEOUT = 30000; // 5 minutes timeout for inactivity
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.REACT_APP_HMS, // Frontend URL for CORS
    methods: ["GET", "POST"],
  }
});

// Verify JWT middleware
const verifyJWT = (token:any) => {
  try {
    return jwt.verify(token, process.env.SKJWT as any);
  } catch (err) {
    return null;
  }
};
let connectedUsers:any = {}; // Track connected users and their sockets
io.on("connection", (socket) => {
  

// Handle user authentication
socket.on("authenticate", (token) => {
  try {
    const decoded:any = verifyJWT(token);
    console.log("User connected:", decoded);

    // If decoded is valid (JWT is not expired and is properly signed)
    if (decoded) {
      // Store the user's socket ID and last activity timestamp
      connectedUsers[decoded.userId] = {
        socketId: socket.id,
        lastActivity: Date.now(),
      };
 
    
      console.log(`${decoded.userId} authenticated with socket ID: ${socket.id}, last activity at ${Date.now()}`);
    } else {
      // If the token is invalid or expired, notify the user
      socket.emit("logout", { message: "Invalid or expired token" });
      console.log("Invalid or expired token received.");
    }
  } catch (error) {
    // If the token verification fails, handle the error
    console.error("Token verification failed:", error);
    socket.emit("logout", { message: "Invalid token" });
  }
});

  // Handle forced logout for specific users
  app.post("/force-logout", (req, res) => {
    const { username } = req.body;

    if (connectedUsers[username]) {
      const userSocketId = connectedUsers[username];
      io.to(userSocketId).emit("logout", { message: "You have been logged out" });
      delete connectedUsers[username];
      res.json({ message: `${username} has been logged out` });
    } else {
      res.status(404).json({ message: "User not found or not connected" });
    }
  });

// Handle user disconnection
socket.on("disconnect", () => {
  for (const userId in connectedUsers) {
    if (connectedUsers[userId].socketId === socket.id) {
      // If the socket ID matches, remove the user from the connected users list
      delete connectedUsers[userId];
      console.log(`User ${userId} disconnected`);
      break;
    }
  }
});

    // Listen for specific user actions that reset inactivity timer
    socket.on('user-action', (username) => {
      if (connectedUsers[username]) {
        connectedUsers[username].lastActivity = Date.now();
      }
    });
});

// Periodic check for inactivity (for automatic logout)
setInterval(() => {
  const now = Date.now();
  for (const username in connectedUsers) {
    console.log(`User ${username} interval`);
    const user = connectedUsers[username];
    if (now - user.lastActivity > INACTIVITY_TIMEOUT) {
      // If the user is inactive for more than 5 minutes
   
      io.to(user.socketId).emit("logout", { message: "You have been logged out due to inactivity" });
      delete connectedUsers[username];
      console.log(`User ${username +' & '+ user.socketId} has been logged out due to inactivity`);
    }
  }
}, 30000); // Check every minute

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized.');

    // Public routes
    app.use('/auth', authRouter);
    // Protected route with JWT authentication
    app.use('/user', verifyToken, userlist);

    // Start the server
    server.listen(port, () => {
      console.log(`Server running at ${process.env.DB_HOST}:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });
