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
import { app, port, server } from './socket';
import msgrouter from './chat/chatAPI';


// Set body parser limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized.');

    // Public routes
    app.use('/api/auth', authRouter);
    app.use('/api/refferal', refferalRouter);
    app.use('/api/notification', NotificationRouter);
    // Protected route with JWT authentication
    //  app.use('/api/user', verifyToken, userRouter);
    app.use('/api/user', userRouter);
    app.use(userActivityUpdate)
    app.use('/api/cam', camRouter);
    app.use('/api/msg', msgrouter);
  
    server.listen(port, () => {
      console.log(`Server running at ${process.env.DB_HOST}:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

 