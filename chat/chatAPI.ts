import express from "express";
import { Message } from "../entity/chat";
import { AppDataSource } from "../socket";
import { In } from "typeorm";

const msgrouter = express.Router();

msgrouter.get("/unread-messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const messageRepository = AppDataSource.getRepository(Message);

  const unreadMessages = await messageRepository.find({
    where: { receiver_id: userId, is_read: false },
    order: { timestamp: "ASC" },
  });

  res.json(unreadMessages);
});

msgrouter.get("/messages", async (req, res) => {
    const { senderId, receiverId } = req.query;
  
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Missing senderId or receiverId" });
    }
  
    const messageRepository = AppDataSource.getRepository(Message);
  
    try {
        const messages = await messageRepository.find({
            where: {
              sender_id: In([senderId, receiverId]),
              receiver_id: In([senderId, receiverId]),
            },
            order: { timestamp: "ASC" },
          });
  
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

export default msgrouter;
