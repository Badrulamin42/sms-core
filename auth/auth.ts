// src/routes/auth.ts
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/user';
import * as jwt from 'jsonwebtoken';

const authRouter = Router();
const jwtoken: any = process?.env?.SKJWT

authRouter.post('/register', async (req, res) => {
    const { email, password, name, isSuperUser } = req.body;
  const userRepository = AppDataSource.getRepository(User);

  // Input validation (basic example)
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required', result: 'failed' });
  }

  try {
    // Check if user already exists
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists', result: 'failed' });
    }

    // Create new user
    const user = new User();
    user.email = email;
    user.name = name;
    user.isSuperUser = isSuperUser;


    // Hash password before saving (assuming setPassword hashes the password)
    await user.setPassword(password);
    await userRepository.save(user);

    res.status(201).json({ message: 'User registered successfully', result: 'true' });
  } catch (error) {
    console.error('Error registering user:', error); // Log the error for debugging
    res.status(500).json({ message: 'Error registering user', result: 'failed' });
  }
  });
  
  authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const userRepository = AppDataSource.getRepository(User);
  
    try {
      const user: any = await userRepository.findOneBy({ email });
      if (!user || !(await User.checkPassword(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ userId: user.id, userName: user.name }, jwtoken, {
        expiresIn: '24h',
      });

      delete user.password;
    
      res.json({ token, ...user });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error });
    }
  });
  
  export default authRouter;
