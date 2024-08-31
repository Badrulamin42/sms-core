import 'reflect-metadata';
import express, { Request, Response, Router } from 'express';
import { AppDataSource } from './config/ormconfig';
import { User } from './entity/user';
import cors from 'cors';
import authRouter from './auth/auth';


const app = express();
const port = process.env.PORT || 3000;


app.use(cors()); // Enable CORS
app.use(express.json());
app.use('/auth', authRouter);

// Initialize TypeORM data source
AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized.');



    // Define route to fetch users
    app.get('/data', async (req: Request, res: Response) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const users = await userRepository.find();
        res.json(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Database query error');
      }
    });

    

    // Start the server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
    });

  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });
