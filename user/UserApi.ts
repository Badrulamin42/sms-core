// src/routes/auth.ts
import { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/user';
import { createLog } from "../middleware/Logging";
import { Resolver, Query, Mutation, Arg } from 'type-graphql';

const userRouter = Router();


 // Define route to fetch users
 userRouter.get('/list', async (req, res) => {
    try {
      const userReqId:any = req.query.ID; 
      const userRepository = AppDataSource.getRepository(User);
      const userReq  = await userRepository.findOneBy({ id:userReqId });

      const users = await userRepository.find({
        select: ['id', 'name', 'email', 'isSuperUser'], // List the fields you want to include
      });
      const nonSuperusers = await userRepository.find({
        select: ['id', 'name', 'email', 'isSuperUser'], // List the fields you want to include
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

  userRouter.post('/register', async (req, res) => {
    const { email, password, name, isSuperUser, actionBy } = req.body;
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
    await createLog("CREATE", "User", { email, name, isSuperUser }, actionBy);
    res.status(201).json({ message: 'User registered successfully', result: 'true' });
  } catch (error) {
    console.error('Error registering user:', error); // Log the error for debugging
    res.status(500).json({ message: 'Error registering user', result: 'failed' });
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
