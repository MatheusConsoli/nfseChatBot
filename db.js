const {MongoClient} = require('mongodb')
const telegram = require('./telegram')

const client = new MongoClient('mongodb+srv://admin:admin@cluster0.qnyrdsd.mongodb.net/TelegramBot?retryWrites=true&w=majority')

async function start(){
    await client.connect()
    module.exports = client.db('my-bot-db').collection('sessions')
    console.log('Connected to MongoDB database');
}

start()
telegram.startBot();