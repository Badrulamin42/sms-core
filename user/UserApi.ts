// src/routes/auth.ts
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/User/user';
import { createLog } from "../middleware/Logging";
import { Resolver, Query, Mutation, Arg } from 'type-graphql';
import { TelegramBotService } from '../telegram/cam_notification';
import { TempOtp } from '../entity/tempotp';
import { Referral } from '../entity/Referral/Refferal';
import multer from 'multer';
import { Role } from '../entity/User/roles';
const sendEmail = require("../service/mailer");

const { nanoid } = require('nanoid');
const userRouter = Router();

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

// Define route to fetch users
userRouter.get('/list', async (req, res) => {
  try {
    const userReqId: any = req.query.ID;
    const userRepository = AppDataSource.getRepository(User);
    const userReq = await userRepository.findOneBy({ id: userReqId });

    const users = await userRepository.find({
      select: ['id', 'name', 'email', 'isSuperUser', 'referralCode', 'lastActivity', 'createdDate', 'phoneNumber', 'role', 'jobTitle'], // List the fields you want to include
    });
    const nonSuperusers = await userRepository.find({
      select: ['id', 'name', 'email', 'isSuperUser', 'referralCode', 'lastActivity', 'createdDate', 'phoneNumber', 'role', 'jobTitle'], // List the fields you want to include
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

userRouter.post('/register', upload.single("image"), async (req, res) => {
  const { email, password, name, isSuperUser, actionBy, telegram, chatId, ref, phoneNumber, roleId, jobTitle } = req.body;
  const image = req.file ? req.file.buffer : null; // Store image as binary

  const userRepository = AppDataSource.getRepository(User);
  const referrerRepository = AppDataSource.getRepository(Referral);
  const roleRepository = AppDataSource.getRepository(Role);

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
    user.jobTitle = jobTitle

    // Handle role assignment (optional)
    if (roleId) {
      const role = await roleRepository.findOneBy({ id: roleId });
      if (!role) {
        return res.status(400).json({ success: false, message: 'Invalid role ID' });
      }
      user.role = role;
    } else if (roleId === null) {
      // Unassign role if explicitly passed as null
      user.role = null;
    }


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



//update
userRouter.put('/update', async (req, res) => {
  try {
    const { id, name, email, isSuperUser, roleId, jobTitle, phoneNumber } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for updating user details',
      });
    }

    const userRepository = AppDataSource.getRepository(User);
    const roleRepository = AppDataSource.getRepository(Role);

    const user = await userRepository.findOne({
      where: { id },
      relations: ['role'], // if needed
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (isSuperUser !== undefined) user.isSuperUser = isSuperUser;
    if (jobTitle) user.jobTitle = jobTitle;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    // Handle role assignment (optional)
    if (roleId) {
      const role = await roleRepository.findOneBy({ id: roleId });
      if (!role) {
        return res.status(400).json({ success: false, message: 'Invalid role ID' });
      }
      user.role = role;
    } else if (roleId === null) {
      // Unassign role if explicitly passed as null
      user.role = null;
    }

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
