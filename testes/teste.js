const chatController = require('./controllers/chatController');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('5885503969:AAGp-v5aeuYqwzIL4xovhr0ARaUl9GmZOUc', { polling: true });



bot.onText(/\/start/,chatController.startup()); 