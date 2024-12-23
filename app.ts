import 'reflect-metadata';
import express, { Application, Request, Response, Router } from 'express';
import { AppDataSource } from './config/ormconfig';
import cors from 'cors';
import authRouter from './auth/auth';
import userRouter from './user/UserApi';
import verifyToken from './middleware/authmiddleware';
import { Server } from 'socket.io';
import http from 'http';
import * as jwt from 'jsonwebtoken';
import userActivityUpdate from './middleware/userActitvyUpdate';
import { User } from './entity/user';



const { exec } = require('child_process');
const app: Application = express();
const port = process.env.PORT;

const allowedOrigins:any = [
  process.env.REACT_APP_HMS, 
  "http://localhost:3000",
  'http://myserver.local:3000'
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // If the origin is not in the list, block the request
      console.log(`Blocked CORS request from: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    credentials: true, // Allow cookies/auth headers
  })
);
app.use(express.json());
const INACTIVITY_TIMEOUT = 300000; // 5min
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Frontend URL for CORS
    methods: ["GET", "POST"],
  }
});
// name = badrulaminz.aj@gmail.com
// appid = 1000544868
// pass = Myaminmg42
const cameraRTSPUrl = 'rtsp://192.168.0.156:80/stream'; // Replace with your camera's RTSP URL
app.get('/test-cors', (req, res) => {
  res.send('CORS is working!');
});
// Route to serve the video stream
app.get('/camera-feed', (req, res) => {
    res.setHeader('Content-Type', 'video/mp4');
    
    // Use ffmpeg to convert the RTSP stream to a format suitable for the browser
    const ffmpeg = exec(`ffmpeg -i ${cameraRTSPUrl} -vcodec libx264 -acodec aac -f mp4 -`);
    
    ffmpeg.stdout.pipe(res);
    ffmpeg.stderr.on('data', (data:any) => console.error(`FFmpeg stderr: ${data}`));
});

// Serve static files (e.g., HTML file)
app.use(express.static('public'));

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
    const decoded:any = verifyJWT(token); // Verify the token (ensure `verifyJWT` is implemented correctly)
    console.log("User connected:", decoded);

    if (decoded) {
      // Ensure connectedUsers entry exists for the user
      if (!connectedUsers[decoded.userId]) {
        connectedUsers[decoded.userId] = [];
      }

      // Check if this socket ID already exists for the user
      const isAlreadyConnected = connectedUsers[decoded.userId].some(
        (connection:any) => connection.socketId === socket.id
      );

      if (!isAlreadyConnected) {
        // Add the new connection (socket ID and activity timestamp) to the array
        connectedUsers[decoded.userId].push({
          socketId: socket.id,
          lastActivity: Date.now(),
        });

        console.log(
          `${decoded.userId} authenticated with socket ID: ${socket.id}, last activity at ${Date.now()}`
        );
      } else {
        console.log(
          `User ${decoded.userId} with socket ${socket.id} is already connected`
        );
      }
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
  // app.post("/force-logout", (req, res) => {
  //   const { username } = req.body;

  //   if (connectedUsers[username]) {
  //     const userSocketId = connectedUsers[username];
  //     io.to(userSocketId).emit("logout", { message: "You have been logged out" });
  //     delete connectedUsers[username];
  //     res.json({ message: `${username} has been logged out` });
  //   } else {
  //     res.status(404).json({ message: "User not found or not connected" });
  //   }
  // });
  socket.on("user-action", (userId) => {
    if (connectedUsers[userId]) {
      // Find the specific connection for this socket ID and update its lastActivity
      const connection = connectedUsers[userId].find((conn :any) => conn.socketId === socket.id);
      if (connection) {
        connection.lastActivity = Date.now();
        console.log(`Activity updated for user ${userId}, socket ${socket.id}`);
      }
    }
  });

  socket.on("disconnect", () => {
    for (const userId in connectedUsers) {
      // Find the user connection with the matching socket ID
      connectedUsers[userId] = connectedUsers[userId].filter(
        (conn:any) => conn.socketId !== socket.id
      );

      // If no connections remain for the user, delete the user entry
      if (connectedUsers[userId].length === 0) {
        delete connectedUsers[userId];
        console.log(`User ${userId} disconnected completely`);
      }
    }
  });

  // Handle user actions that reset inactivity timer
 
});

// Periodic check for inactivity (for automatic logout)
setInterval(async () => {
  for (const username in connectedUsers) {
    console.log(`User ${username} interval`);
    
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
    app.use('/auth', authRouter);
    // Protected route with JWT authentication
    app.use('/user', verifyToken, userRouter);
    app.use(userActivityUpdate)
    // Start the server
 
    server.listen(port, () => {
      console.log(`Server running at ${process.env.DB_HOST}:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

