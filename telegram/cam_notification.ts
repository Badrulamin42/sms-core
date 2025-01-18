import TelegramBot from 'node-telegram-bot-api';

// Define the Bot class
export class TelegramBotService {
    private bot: TelegramBot;

    constructor(token: string) {
        // Initialize the bot with the provided token
        this.bot = new TelegramBot(token, { polling: true });
    }

    // Function to send message to a specific user
    sendMessageToUser(chatId: string | number, message: string): void {
        // Send the message using the bot instance
        this.bot.sendMessage(chatId, message)
            .then(() => {
                console.log(`Message sent to ${chatId}`);
            })
            .catch((error: Error) => {
                console.error('Error sending message:', error);
            });
    }
}

// Usage example
const botToken = '7911946633:AAGg6RoGaGhbMYO-cmbbJ8UC_6VdUOtfphI'; // Replace with your bot token
const chatId = '1293926065'; // Replace with the actual chat ID

const botService = new TelegramBotService(botToken);


