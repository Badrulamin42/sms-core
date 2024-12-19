// src/routes/auth.ts
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/user';
import * as jwt from 'jsonwebtoken';
import { createLog } from "../middleware/Logging";

const authRouter = Router();
const jwtoken: any = process?.env?.SKJWT
  
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
