const TelegramBot = require('node-telegram-bot-api');
const {MongoClient} = require('mongodb');

const bot = new TelegramBot('5885503969:AAGp-v5aeuYqwzIL4xovhr0ARaUl9GmZOUc', { polling: true });

MongoClient.connect('mongodb+srv://admin:admin@cluster0.qnyrdsd.mongodb.net/TelegramBot?retryWrites=true&w=majority', { useNewUrlParser: true })
  .then((client) => {
    const db = client.db('my-bot-db');
    console.log('Connected to MongoDB database');

    // Handle incoming messages
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      // Check if user has an active session
      const session = await db.collection('sessions').findOne({ user_id: userId });
      if (!session) {
        // User does not have an active session, create a new one to collect username
        await db.collection('sessions').insertOne({ user_id: userId, state: 'USERNAME' });
        bot.sendMessage(chatId, 'Please enter your username:');
      } else {
        // User has an active session, handle the message based on the session state
        switch (session.state) {
          case 'USERNAME':
            // Store the username and transition to password state
            await db.collection('sessions').updateOne({ user_id: userId }, { $set: { username: msg.text, state: 'PASSWORD' } });
            bot.sendMessage(chatId, 'Please enter your password:');
            break;
          case 'PASSWORD':
            // Store the password and transition to tomador state
            await db.collection('sessions').updateOne({ user_id: userId }, { $set: { password: msg.text, state: 'TOMADOR' } });
            bot.sendMessage(chatId, 'Please enter the tomador:');
            break;
          case 'TOMADOR':
            // Store the tomador and transition to tipoServico state
            await db.collection('sessions').updateOne({ user_id: userId }, { $set: { tomador: msg.text, state: 'TIPOSERVICO' } });
            bot.sendMessage(chatId, 'Please enter the tipo de serviço:');
            break;
          case 'TIPOSERVICO':
            // Store the tipo de serviço and transition to descricao state
            await db.collection('sessions').updateOne({ user_id: userId }, { $set: { tipoServico: msg.text, state: 'DESCRICAO' } });
            bot.sendMessage(chatId, 'Please enter the descricao:');
            break;
          case 'DESCRICAO':
            // Store the descricao and transition to valor state
            await db.collection('sessions').updateOne({ user_id: userId }, { $set: { descricao: msg.text, state: 'VALOR' } });
            bot.sendMessage(chatId, 'Please enter the valor:');
            break;
          case 'VALOR':
            // Store the valor and end the session
            await db.collection('sessions').updateOne({ user_id: userId }, { $set: { valor: msg.text, state: 'VALIDACAO' } });
            bot.sendMessage(chatId, 'Obrigado! Suas informações foram salvas.');
            break;

          case 'VALIDACAO':            
          bot.sendMessage(chatId, 'Thank you! Your information has been saved.');
          break;

          default:
            bot.sendMessage(chatId, 'I did not understand that command.');
            break;
        }

        // If the session is finished, remove the session document from the database
        if (session.state === 'FINISHED') {
          await db.collection('sessions').deleteOne({ user_id: userId });
        }
      }
    });
  })