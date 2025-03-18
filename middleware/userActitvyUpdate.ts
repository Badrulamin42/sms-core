import express, { Router } from 'express';
import { AppDataSource } from '../config/ormconfig';
import { User } from '../entity/User/user'; // Adjust the path to your User entity

const userActivityUpdate = Router();

userActivityUpdate.post('/api/update-activity', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Use the 'where' clause to find the user by ID
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the last activity timestamp
    user.lastActivity = new Date();
    await userRepository.save(user); // Save the updated user

    res.status(200).json({ message: 'Last activity updated successfully' });
  } catch (error) {
    console.error('Error updating last activity:', userId, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default userActivityUpdate;
