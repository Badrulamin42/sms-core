
import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import {TelegramBotService} from '../telegram/cam_notification';
import { TempOtp } from '../entity/tempotp';
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/User/user';
const sendEmail = require("../service/mailer");
const userRouter = Router();


function generateRandomSixDigit(): string {
  return (100000 + Math.random() * 900000).toFixed(0);
}



const botService = new TelegramBotService('7911946633:AAGg6RoGaGhbMYO-cmbbJ8UC_6VdUOtfphI');

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

  //verify telegram otp
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

  //email otp
userRouter.post('/register/email/otp', async (req, res) => {
  const { email } = req.body;
const userRepository = AppDataSource.getRepository(User);

// Input validation (basic example)
if (!email) {
  return res.status(400).json({ message: 'Email is required', result: 'failed' });
}
const timestamp = Date.now();
let OTP = generateRandomSixDigit()


try {
  // Check if user already exists

  const tempOtpRepository = AppDataSource.getRepository(TempOtp);
  const existingUsertel = await userRepository.findOneBy({ email : email });
  if (existingUsertel) {
    return res.status(400).json({ message: 'User already exists : email', result: 'failed' });
  }
// send email
const otpTemplate = require("../service/template/otp");
const htmlContent = otpTemplate(OTP);

sendEmail(email, "One Time Password", `Your OTP is: ${OTP}`, htmlContent)
  .then(() => console.log("Email sent successfully!"))
  .catch((err: any) => console.error("Email failed:", err));
  
 tempOtpRepository.save({ Email :email, otp:OTP, generatedAt: timestamp });

  res.status(200).json({ message: 'sent OTP successfully', result: 'true', email });
} catch (error) {
  console.error('Error registering user:', error); // Log the error for debugging
  res.status(500).json({ message: 'Error registering user', result: 'failed' });
}
});

userRouter.post('/register/email/verify', async (req, res) => {
  const { otpcode, actionBy, email } = req.body;
const userRepository = AppDataSource.getRepository(User);
const tempOtpRepository = AppDataSource.getRepository(TempOtp);


try {
  // Check if user already exists

  const tempOtp = await tempOtpRepository.findOne({ where: { Email:email } });

  if (!tempOtp) {
    return res.status(404).json({ message: 'No OTP found for this email or phone', result: 'failed' });
  }

 // Check if the OTP matches
 if (tempOtp.otp !== otpcode) {
  return res.status(400).json({ message: 'Invalid OTP', result: 'failed' });
}

// Check if the OTP is expired (e.g., 5 minutes)
const otpExpiryTime = 10 * 60 * 1000; // 5 minutes in milliseconds
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