// src/routes/auth.ts
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/User/user';
import { createLog } from "../middleware/Logging";
import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import {TelegramBotService} from '../telegram/cam_notification';
import { TempOtp } from '../entity/tempotp';
import { getRepository } from 'typeorm';
import { Referral } from '../entity/Referral/Refferal';
const refferalRouter = Router();

const botService = new TelegramBotService('7911946633:AAGg6RoGaGhbMYO-cmbbJ8UC_6VdUOtfphI');

const buildReferralTree = async (userId: string) => {
    const referralRepository = AppDataSource.getRepository(Referral);
    const userRepository = AppDataSource.getRepository(User);

    // Fetch all referrals with their referred users
    const referrals = await referralRepository.find({
        relations: ["affiliate"], // Load the affiliate (referrer)
    });

    // Fetch all users (ensure profile picture conversion)
    const users = await userRepository.find({
        select: ["id", "name", "email", "image"],
    });

    // Create user map for quick lookup & convert profile picture
    const userMap = new Map<string, any>();
    users.forEach(user => {
        userMap.set(user.id, {
            id: user.id,
            name: user.name,
            email: user.email,
            profilePicture: user.image
                ? `data:image/png;base64,${Buffer.from(user.image).toString("base64")}`
                : null, // Convert BLOB to Base64
            children: [],
        });
    });

    // Build referral tree based on the referral table
    referrals.forEach(referral => {
        const parent = userMap.get(referral.affiliate.id); // Referring user
        const child = userMap.get(referral.referredUserId); // Referred user

        if (parent && child) {
            parent.children.push(child);
        }
    });

    // Return referral tree starting from `userId`
    return userMap.get(userId) || { message: "User not found or has no referrals", children: [] };
};



 // Define route to fetch users
 refferalRouter.post('/list', async (req, res) => {
    const { userId } = req.body;
    try {
      
        const referralTree = await buildReferralTree(userId);
        res.json(referralTree);
    } catch (error) {
        console.error("Error generating referral tree:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  });

  //create


  
  export default refferalRouter;
