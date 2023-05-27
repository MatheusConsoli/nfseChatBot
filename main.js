const Chat = require('./models/Chat')
const RPA = require('./models/Rpa')
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const bot = new TelegramBot('5885503969:AAGp-v5aeuYqwzIL4xovhr0ARaUl9GmZOUc', { polling: true });

let rpa = new RPA();

/*{
    _id: new ObjectId("6431b97f05d0ecf51e4c0068"),
    userId: 38281274,
    state: 'VALIDACAO',
    username: '33.662.191/0001-06',
    password: 'Consoli014',
    tomador: '34.433.844/0001-48',
    tipoServico: 'CODIGO',
    descricao: 'DESCRICAO',
    valor: '001'
  }
*/

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome to my bot!", {

    });
    console.log(msg.text)
});

bot.on('message', async (msg) => {
    
        let chat = new Chat(msg);
        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const session = await chat.isActive(userId)
        console.log(session)

        //Verifica se o usuário já possui sessão ativa, caso não possui, uma nova sessão é criada e a conversa se inicia;
        if (!session) {

             
            await chat.insertOne(userId)
            bot.sendMessage(chatId, "Por gentileza, digite seu CNPJ que é utilizado para o Login do Portal da Nota Fiscal Eletronica: ");


        } else {

            switch (session.state) {
                case 'USERNAME':
                    await chat.updateOne(userId, msg.text, 'PASSWORD');
                    bot.sendMessage(chatId, "Por gentileza, digite sua senha que é utilizada para o Login Portal da Nota Fiscal Eletronica: ");
                    break;

                case 'PASSWORD':
                    await chat.updateOne(userId, msg.text, 'TOMADOR');
                    bot.sendMessage(chatId, "Por gentileza, insira o Tomador do Serviço prestado: ");
                    break;

                case 'TOMADOR':
                    await chat.updateOne(userId, msg.text, 'TIPOSERVICO');
                    bot.sendMessage(chatId, "Por gentileza, insira o código do tipo de serviço prestado: ");
                    break;

                case 'TIPOSERVICO':
                    await chat.updateOne(userId, msg.text, 'DESCRICAO');
                    bot.sendMessage(chatId, "Por gentileza, insira a descriçao do serviço prestado: ");
                    break;

                case 'DESCRICAO':
                    await chat.updateOne(userId, msg.text, 'VALOR');
                    bot.sendMessage(chatId, "Por gentileza, insira o valor total do serviço prestado: ");
                    break;

                case 'VALOR':    
                    await chat.updateOne(userId, msg.text, 'VALIDACAO');                
                    bot.sendMessage(chatId,"Obrigado, suas informações foram salvas!\nPor gentileza valide se as informações para a emissão estão corretas:")
                    simulateMessage('a',chatId, userId);
                    break;

                case 'VALIDACAO':
                    //Variavel invoice recebe os dados da sessao do usuario para que seja colocado na pergunta
                    let invoice = await chat.validateInvoice(userId)

                    //Mensagem para o usuario validar os dados enviados ao chat durante a conversa
                    const message = `\nUsuario: ${invoice.username}\nSenha: ${invoice.password}\nCNPJ do Tomador: ${invoice.tomador}\nDescrição do Serviço: ${invoice.descricao}\nValor do serviço: ${invoice.valor}\nCaso clique em Sim, o documento será emitido, caso clique em Não, o processo será reiniciado.`                    
                    const question = 'As informações para a emissão estão corretas?'
                    
                    //Botoes da pergunta de validacao
                    const yesButton = { text: 'Sim', callback_data: 'validacao-yes' }
                    const noButton = { text: 'Não', callback_data: 'validacao-no' }
                    
                    //Variavel responsavel pela pergunta, utilizando os botoes instanciados acima
                    const options = { reply_markup: { inline_keyboard: [[yesButton, noButton]] } };
                    
                    //Bot envia a pergunta, com a mensagem montada a partir da variavel invoice e utilizando os botões e a constante "options"
                    bot.sendMessage(chatId, `${message}\n${question}`, options)

                    //Variavel criada para receber a resposta do usuário através de uma função assincrona
                    let userResponse = await new Promise((resolve) =>{
                    
                    bot.on('callback_query', async (callbackQuery) => {
                      const data = callbackQuery.data
                      if (data === 'validacao-yes') {
                        resolve('yes');
                      } else if (data === 'validacao-no') {
                        resolve('no');
                      } else {
                        console.log('Invalid callback data:', data);
                      }
                    });
                });
                  
                    //Caso o usuário clique no botão "sim", o processo de emissão é iniciado através da chamada rpa.acessarSite(session), passando como parametro todos os dados dessa sessão
                    if (userResponse === 'yes') {
                      console.log("Inicia o Robo, e exclui a sessão do banco")
                      try {

                        await rpa.acessarSite(session);
                        bot.sendMessage(chatId, 'Documento emitido com sucesso!');    

                        sendImage(chatId,"C:/Users/VM/Desktop/Trabalho/OneDrive - S2M CONSULTORIA E SISTEMAS LTDA EPP/Bkp PC/FATEC/JS/Puppeteer/testes/emitido.png")
                        simulateMessage('a',chatId, userId);
                        
                      } catch (error) {
                        console.log(error)
                        bot.sendMessage(chatId, 'Documento não emitido, por gentileza tente novamente.');
                      }
                    } else if (userResponse === 'no') {
                      console.log("Reinicia a sessão pedindo as informações novamente");
                      chat.endSession(userId)
                      simulateMessage('a',chatId, userId);
                    } else {
                      console.log('User has not responded yet');
                    }
                    break;

                    default:
                        bot.sendMessage(chatId, 'Comando inválido');
                        break;
            }
        }
        
});

function sendImage(chatId, imagePath) {

  // Read the image file as a buffer
  const imageBuffer = fs.readFileSync(imagePath);
  let caption = "Segue evidencia de que o documento foi emitido com sucesso."
  
  // Send the photo
  bot.sendPhoto(chatId, imageBuffer, { caption })
    .then(() => {
      console.log('Image sent successfully');
    })
    .catch((error) => {
      console.error('Error sending image:', error);
    });
}
  
function simulateMessage(text, chatId, userId) {
    const message = {
      text: text,
      chat: {
        id: chatId
      },
      from: {
        id: userId
      }
    };
    bot.emit('message', message);
  }



              


