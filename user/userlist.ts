// src/routes/auth.ts
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/user';


const userlist = Router();


 // Define route to fetch users
 userlist.get('/list', async (req, res) => {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Database query error');
    }
  });
  
  export default userlist;
