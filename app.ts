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
import userVerifyRouter from './user/UserVerification';
import createProjectRouter from './project/projectApi';
import path from 'path';
import roleRouter from './Role/roleApi';
import permRouter from './Permission/permissionApi';
import projectUnitRouter from './project/projectUnitApi';

// Set body parser limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


console.log('__dirname:', __dirname);
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized.');
    app.use('/uploads', express.static(path.join(__dirname, '../../hms/public/uploads')));
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
    app.use('/api/userVerify',userVerifyRouter);
    app.use('/api/project',createProjectRouter);
    app.use('/api/roles', roleRouter);  
    app.use('/api/permissions', permRouter);
    app.use('/api/projectUnit', projectUnitRouter);

    server.listen(port, () => {
      console.log(`Server running at ${process.env.DB_HOST}:${port}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

 