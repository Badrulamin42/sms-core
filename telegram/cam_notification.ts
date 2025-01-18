import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
// Define the Bot class
export class TelegramBotService {
    private bot: TelegramBot;

    constructor(token: string) {
        // Initialize the bot with the provided token
        this.bot = new TelegramBot(token, { polling: true });


    }

    // Function to send message to a specific user
    sendMessageWithImage(chatId: string | number, message: string, imagePath: string): void {
        // Send message and photo using the bot instance
        this.bot.sendPhoto(chatId, fs.createReadStream(imagePath), { caption: message })
            .then(() => {
                console.log(`Message with image sent to ${chatId}`);
            })
            .catch((error: Error) => {
                console.error('Error sending message with image:', error);
            });
    }
}