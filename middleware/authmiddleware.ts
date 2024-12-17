import express from 'express';
import * as jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.REACT_APP_HMS, // Frontend URL for CORS
  }
});

const jwtoken: string = process?.env?.SKJWT || 'your_jwt_secret';


// Middleware to verify JWT for HTTP requests (not WebSocket)
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(403).json({ message: 'Access denied. No token provided' });
  }

  try {
    jwt.verify(token, jwtoken);
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    io.on('connection', (socket) => {
    socket.emit('logout');
  });
    return res.status(401).json({ message: 'Invalid or expired token' });
    
  }
};

// WebSocket middleware to verify JWT


// WebSocket connection handler
// io.on('connection', (socket) => {
//   console.log('A user connected', socket);

//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });

//   // If the JWT is expired or invalid, emit forceLogout event to the frontend
//   socket.on('forceLogout', () => {
//     io.emit('forceLogout', { message: 'Your session has expired. Please log in again.' });
//   });
// });




export default verifyToken;
