import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import bodyParser from 'body-parser';
import axios from 'axios';
const fs = require("fs");
export class TelegramBotService {
    private bot: TelegramBot;
    private app: express.Application;
    private sessions: Map<number, { username: string; isVerified: boolean; createdAt: number }> = new Map();
    private sessionExpiryTime = 120000; // Session expiry time in milliseconds (2 minutes)
    apiUrl: any;

    constructor(token: string) {
        // Initialize the bot with the provided token, without polling
        this.bot = new TelegramBot(token);
        this.app = express();
        this.apiUrl = `https://api.telegram.org/bot${token}`;
        // Set up express middleware
        this.app.use(bodyParser.json()); // for parsing application/json

 
  

       
    }

    async getUpdates() {
        try {
          // Send GET request to the getUpdates endpoint
          const response = await axios.get(`${this.apiUrl}/getUpdates`);
          
          // Handle the response
          const updates = response.data.result;
          console.log('Received updates:', updates);
    
          // Process updates if necessary
          updates.forEach((update:any) => {
            this.handleUpdate(update);
          });
        } catch (error) {
          console.error('Error fetching updates:', error);
        }
      }

    // Function to handle incoming updates (messages) from Telegram
    private handleUpdate(update: any) {
        if (update.message && update.message.chat && update.message.from && update.message.from.username) {
            const chatId = update.message.chat.id;
            const username = update.message.from.username;

            // Add or update the session with the current timestamp
            this.sessions.set(chatId, { username, isVerified: false, createdAt: Date.now() });
            console.log(`Tracked session: Chat ID ${chatId}, Username: ${username}`);

            // Clean up expired sessions
            this.cleanUpExpiredSessions();
        }
    }

    sendMessageWithImage(chatId: string | number, message: string, imagePath: string): void {
        this.bot.sendPhoto(chatId, fs.createReadStream(imagePath), { caption: message })
            .then(() => {
                console.log(`Message with image sent to ${chatId}`);
            })
            .catch((error: Error) => {
                console.error('Error sending message with image:', error);
            });
    }

    // Function to send an OTP message to a specific user
    sendMessageOTP(chatId: string | number, message: string): void {
        this.bot.sendMessage(chatId, message)
            .then(() => {
                console.log(`OTP message sent to Chat ID: ${chatId}`);
            })
            .catch((error: Error) => {
                console.error('Error sending OTP message:', error);
            });
    }

    // Cleanup expired sessions
    private cleanUpExpiredSessions() {
        const now = Date.now();
        this.sessions.forEach((session, chatId) => {
            if (now - session.createdAt > this.sessionExpiryTime) {
                // Remove expired sessions
                this.sessions.delete(chatId);
                console.log(`Session for Chat ID ${chatId} expired and removed.`);
            }
        });
    }

    // Function to get session by chat ID (for example, to verify a user)
    public getSessionByChatId(chatId: number) {
        return this.sessions.get(chatId);
    }

    // Function to get chat ID by username
    public getChatIdByUsername(username: string): number | null {
        
     
        for (const [chatId, session] of this.sessions.entries()) {
            if (session.username === username) {
                return chatId;
            }
        }
        return null;
    }
}
