// src/routes/auth.ts
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/User/user';
import { createLog } from "../middleware/Logging";
import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import {TelegramBotService} from '../telegram/cam_notification';
import { TempOtp } from '../entity/tempotp';
import { Referral } from '../entity/Referral/Refferal';
import multer from 'multer';
const { nanoid } = require('nanoid');
const userRouter = Router();

function generateRandomSixDigit(): string {
  return (100000 + Math.random() * 900000).toFixed(0);
}

async function generateUniqueReferralCode(name: string): Promise<string> {
 
  let referralCode;
  let isUnique = false;

  do {
    const prefix = name.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const randomPart = nanoid(5).toUpperCase();
    referralCode = `${prefix}${randomPart}`;

    const existingUser = await AppDataSource.getRepository(User).findOne({ where: { referralCode } });
    if (!existingUser) {
      isUnique = true;
    }
  } while (!isUnique);

  return referralCode;
}

const botService = new TelegramBotService('7911946633:AAGg6RoGaGhbMYO-cmbbJ8UC_6VdUOtfphI');
 // Define route to fetch users
 userRouter.get('/list', async (req, res) => {
    try {
      const userReqId:any = req.query.ID; 
      const userRepository = AppDataSource.getRepository(User);
      const userReq  = await userRepository.findOneBy({ id:userReqId });

      const users = await userRepository.find({
        select: ['id', 'name', 'email', 'isSuperUser', 'referralCode', 'createdDate'], // List the fields you want to include
      });
      const nonSuperusers = await userRepository.find({
        select: ['id', 'name', 'email', 'isSuperUser','createdDate'], // List the fields you want to include
        where: {
          isSuperUser: false, 
        },
      });

    
      res.json(userReq?.isSuperUser ? users : nonSuperusers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Database query error');
    }
  });

  //create
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  userRouter.post('/register',upload.single("image"), async (req, res) => {
    const { email, password, name, isSuperUser, actionBy, telegram, chatId, ref, phoneNumber} = req.body;
    const image = req.file ? req.file.buffer : null; // Store image as binary
    
  const userRepository = AppDataSource.getRepository(User);
  const referrerRepository = AppDataSource.getRepository(Referral);
  // Input validation (basic example)
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required', result: 'failed' });
  }

  try {
    // Check if user already exists
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists : email', result: 'failed' });
    }
    // const existingUsertel = await userRepository.findOneBy({ telegramUsername : telegram });
    // if (existingUsertel) {
    //   return res.status(400).json({ message: 'User already exists : telegram', result: 'failed' });
    // }
 
    // Create new user
    const user = new User();
    user.email = email;
    user.name = name;
    user.isSuperUser = isSuperUser;
    user.phoneNumber = phoneNumber
    user.telegramUsername = telegram === "" ? null : telegram;
    user.chatID = chatId === "" ? null : chatId
    user.image = image ? image : undefined;
    user.referralCode = await generateUniqueReferralCode(name); // Or use user.id if available
 
    

    // Hash password before saving (assuming setPassword hashes the password)
    await user.setPassword(password);
    const savedUser = await userRepository.save(user);

    if (ref) {
      const referrer = await userRepository.findOne({ where: { referralCode: ref } }); // Ensure correct query
    
      if (referrer) {
        const referral = referrerRepository.create({
          affiliate: referrer,
          referredUserId: savedUser.id,
          status: "pending",
          commission: 0.0, // Example commission
        });
    
        await referrerRepository.save(referral); // Use save() via repository
      }
    }

    await createLog("CREATE", "User", { email, name, isSuperUser, telegram }, actionBy);
    res.status(201).json({ message: 'User registered successfully', result: 'true' });
  } catch (error) {
    console.error('Error registering user:', error); // Log the error for debugging
    res.status(500).json({ message: 'Error registering user', result: 'failed' });
  }
  });

//telegram otp
  userRouter.post('/register/otp', async (req, res) => {
    const { telegram, actionBy } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  // Input validation (basic example)
  if (!telegram) {
    return res.status(400).json({ message: 'Email, password, and name are required', result: 'failed' });
  }
  const timestamp = Date.now();
  let OTP = generateRandomSixDigit()


  try {
    // Check if user already exists

    const tempOtpRepository = AppDataSource.getRepository(TempOtp);
    const existingUsertel = await userRepository.findOneBy({ telegramUsername : telegram });
    if (existingUsertel) {
      return res.status(400).json({ message: 'User already exists : telegram', result: 'failed' });
    }


       await botService.getUpdates();
      
 

    const chatId = botService.getChatIdByUsername(telegram); // Custom method in TelegramBotService

    if (!chatId) {
        return res.status(404).json({ message: `Chat ID for username ${telegram} not found or user not verified.`, result: 'failed' });
    }
    
    // Step 2: Send OTP to the user via Telegram
    botService.sendMessageOTP(chatId, `Your OTP is: ${OTP}`);
   tempOtpRepository.save({ Telegramusername :telegram, otp:OTP, generatedAt: timestamp });

    res.status(200).json({ message: 'sent OTP successfully', result: 'true', chatId });
  } catch (error) {
    console.error('Error registering user:', error); // Log the error for debugging
    res.status(500).json({ message: 'Error registering user', result: 'failed' });
  }
  });

  //telegram otp
  userRouter.post('/register/verifyotp', async (req, res) => {
    const { otpcode, actionBy, telegram } = req.body;
  const userRepository = AppDataSource.getRepository(User);
  const tempOtpRepository = AppDataSource.getRepository(TempOtp);


  try {
    // Check if user already exists

    const tempOtp = await tempOtpRepository.findOne({ where: { Telegramusername:telegram } });

    if (!tempOtp) {
      return res.status(404).json({ message: 'No OTP found for this email or phone', result: 'failed' });
    }

   // Check if the OTP matches
   if (tempOtp.otp !== otpcode) {
    return res.status(400).json({ message: 'Invalid OTP', result: 'failed' });
  }

  // Check if the OTP is expired (e.g., 5 minutes)
  const otpExpiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  if (Date.now() - tempOtp.generatedAt > otpExpiryTime) {
    return res.status(400).json({ message: 'OTP expired', result: 'failed' });
  }

  res.status(200).json({ message: 'OTP verified successfully', result: 'true' });

  // Optionally, delete the OTP after successful verification
  await tempOtpRepository.delete(tempOtp.id);
  } catch (error) {
    console.error('Error registering user:', error); // Log the error for debugging
    res.status(500).json({ message: 'Error registering user', result: 'failed' });
  }
  });


  //UPDATE user by ID
  userRouter.put('/update', async (req, res) => {
    try {
      const { id, name, email, isSuperUser } = req.body;
  
      // Validate input
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required for updating user details',
        });
      }
  
      const userRepository = AppDataSource.getRepository(User);
  
      // Find the user to update
      const user = await userRepository.findOneBy({ id });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
  
      // Update user fields if provided
      if (name) user.name = name;
      if (email) user.email = email;
      if (isSuperUser !== undefined) user.isSuperUser = isSuperUser;
  
      // Save the updated user
      await userRepository.save(user);
  
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({
        success: false,
        message: 'Database query error',
      });
    }
  });

  //delete
// DELETE user by ID
userRouter.post('/delete', async (req, res) => {
  const { userID } = req.body;
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOneBy({ id: userID });

  if (user) {
    await userRepository.remove(user);
    return res.status(200).json({ message: `User with ID ${userID} deleted successfully.` });
  } else {
    return res.status(404).json({ message: `User with ID ${userID} not found.` });
  }
});
  
  export default userRouter;
