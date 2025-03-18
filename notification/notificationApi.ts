// src/routes/auth.ts
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/User/user';
import { createLog } from "../middleware/Logging";
import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import {TelegramBotService} from '../telegram/cam_notification';
import { TempOtp } from '../entity/tempotp';
const { sendPushNotification,sendPushNotificationToAll } = require("./notificationController");

const NotificationRouter = Router();

function generateRandomSixDigit(): string {
  return (100000 + Math.random() * 900000).toFixed(0);
}
const botService = new TelegramBotService('7911946633:AAGg6RoGaGhbMYO-cmbbJ8UC_6VdUOtfphI');
 // Define route to fetch users

 NotificationRouter.post("/save-fcm-token", async (req, res) => {
    try {
        const { userID, fcmToken } = req.body;
  
      if (!userID || !fcmToken) {
        return res.status(400).json({ error: "Missing ID or fcmToken" });
      }
  
      const userRepository = AppDataSource.getRepository(User);
  
      // Find a single user, not an array
      const user = await userRepository.findOne({
        where: { id: userID },
        select: ["id", "fcmtoken"], // Select fields explicitly
      });
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Update FCM token
      user.fcmtoken = fcmToken;
      await userRepository.save(user);
  
      res.json({ result: true });
    } catch (error) {
      console.error("Error saving FCM token:", error);
      res.status(500).json({ error: "Database query error" });
    }
  });

 NotificationRouter.post("/send-notification", async (req, res) => {
    const { token, title, body } = req.body;
  
    if (!token || !title || !body) {
      return res.status(400).json({ error: "Missing parameters" });
    }
  
    const result = await sendPushNotification(token, title, body);
    res.json(result);
  });
  

  NotificationRouter.post("/send-notification-all", async (req, res) => {
    const {title, body } = req.body;
  
    if (!title || !body) {
      return res.status(400).json({ error: "Missing parameters" });
    }
  
    const result = await sendPushNotificationToAll(title, body);
    res.json(result);
  });
  
  export default NotificationRouter;
