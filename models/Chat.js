//const validator = require("validator")
const {MongoClient} = require('mongodb')

const client = new MongoClient('mongodb+srv://admin:admin@cluster0.qnyrdsd.mongodb.net/TelegramBot?retryWrites=true&w=majority')

let Chat = function(msg){
    this.msg = msg
    this.errors = []
}

async function dbConnect(){

    await client.connect()    
    console.log('Connected to MongoDB database')

    return client.db('my-bot-db').collection('sessions')
}  

function formatCNPJ(cnpj){
        
        cnpj = cnpj.replace(/\D/g, '');
      
        let formattedCNPJ = cnpj.substr(0, 2) + '.';
        formattedCNPJ += cnpj.substr(2, 3) + '.';
        formattedCNPJ += cnpj.substr(5, 3) + '/';
        formattedCNPJ += cnpj.substr(8, 4) + '-';
        formattedCNPJ += cnpj.substr(12, 2);
      
        return formattedCNPJ;
}

function validateCNPJ(cnpj){
  cnpj = cnpj.replace(/\D/g, '');

  if (cnpj.length !== 14) {
    return false;
  }

  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight--;
    if (weight < 2) {
      weight = 9;
    }
  }
  let verificationDigit1 = sum % 11;
  if (verificationDigit1 < 2) {
    verificationDigit1 = 0;
  } else {
    verificationDigit1 = 11 - verificationDigit1;
  }
  if (parseInt(cnpj.charAt(12)) !== verificationDigit1) {
    return false;
  }

  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight--;
    if (weight < 2) {
      weight = 9;
    }
  }
  let verificationDigit2 = sum % 11;
  if (verificationDigit2 < 2) {
    verificationDigit2 = 0;
  } else {
    verificationDigit2 = 11 - verificationDigit2;
  }
  if (parseInt(cnpj.charAt(13)) !== verificationDigit2) {
    return false;
  }

  return true;
}

Chat.prototype.cleanUp = function (){
    if(typeof(this.msg.userId)!= "string"){
        this.msg.userId = ""
    }
    if(typeof(this.msg.username)!= "string"){
        this.msg.username = ""
    }
    if(typeof(this.msg.password)!= "string"){
        this.msg.password = ""
    }
    if(typeof(this.msg.tomador)!= "string"){
        this.msg.tomador = ""
    }
    if(typeof(this.msg.tipoServico)!= "string"){
        this.msg.tomador = ""
    }
    if(typeof(this.msg.descricao)!= "string"){
        this.msg.tomador = ""
    }
    if(typeof(this.msg.valor)!= "string"){
        this.msg.tomador = ""
    }
    if(typeof(this.msg.state)!= "string"){
        this.msg.state = ""
    }
    return this.msg

    /*this.msg = {
        userId: this.msg.userId.trim(),
        username: this.msg.username.trim().toLowerCase(),
        tomador: this.msg.tomador.trim(),
        tipoServico: this.msg.tipoServico.trim(),
        descricao: this.msg.descricao.trim(),
        valor: this.msg.valor.trim(),
        state: this.msg.state.trim(),
        password: this.msg.password
    }*/
}
Chat.prototype.isActive = async function(usuarioId){
    const chatCollection = await dbConnect()    
    const user = await chatCollection.findOne({ userId: usuarioId });   
    return user   
}

Chat.prototype.insertOne = async function(usuarioId){
    const chatCollection = await dbConnect()
    const user = await chatCollection.insertOne({ userId: usuarioId, state: 'USERNAME' });
    console.log("INSERIDO")
}


Chat.prototype.updateOne = async function(usuarioId,texto,estado){
  
  //Database connection  
  const chatCollection = await dbConnect()

  //Check if user exists
  const existingUser = await chatCollection.findOne({ userId: usuarioId })
  if (!existingUser) {
    console.log('Usuário não encontrado.')
    return
  }

    if(estado == "PASSWORD"){    
        //TO-DO
        const validaCnpj = validateCNPJ(formatCNPJ(texto))
        
        if (validaCnpj == true){
            let cnpj =  formatCNPJ(texto)
            const user = await chatCollection.findOneAndUpdate({ userId: usuarioId },{ $set: {username: cnpj,state: estado } })
            }/*
        else if(validaCnpj == false){
          await chatCollection.findOneAndUpdate({ userId: usuarioId },{ $set: {username: cnpj,state: estado, erro: "CNPJ Inválido" } })
            }*/

    } 
    if(estado == "TOMADOR"){    
        const user = await chatCollection.findOneAndUpdate({ userId: usuarioId },
            { $set: {password: texto,state: estado } }
        )
    }  
    if(estado == "TIPOSERVICO"){    
        const user = await chatCollection.findOneAndUpdate({ userId: usuarioId },
            { $set: {tomador: texto,state: estado } }
        )
    }  
    if(estado == "DESCRICAO"){    
        const user = await chatCollection.findOneAndUpdate({ userId: usuarioId },
            { $set: {tipoServico: texto,state: estado } }
        )
    }  
    if(estado == "VALOR"){           
        const user = await chatCollection.findOneAndUpdate({ userId: usuarioId },
            { $set: {descricao: texto,state: estado } }
        )
    }  
    if(estado == "VALIDACAO"){

        const user = await chatCollection.findOneAndUpdate({ userId: usuarioId },
            { $set: {valor: texto,state: estado } }
        )
    } 


}


Chat.prototype.validateInvoice = async function(usuarioId){
  const userId = parseInt(usuarioId);
  const chatCollection = await dbConnect() 
  const dataInvoice = await chatCollection.findOne({userId: usuarioId})
  console.log(dataInvoice)
  return dataInvoice;
}

/*
Chat.prototype.endSession = async function(usuarioId){

    const chatCollection = await dbConnect()    
    const endSession = await chatCollection.deleteOne({ user_id: usuarioId });
    console.log("Usuario deletado: ")
    console.log(usuarioId)
return endSession
}
*/

Chat.prototype.endSession = async function(usuarioId){
  const userId = parseInt(usuarioId)
  const chatCollection = await dbConnect()    
  const endSession = await chatCollection.deleteOne({userId: userId})


return endSession
}

Chat.prototype.register = function(){
    // Step #1: Validate User data
    this.cleanUp()
    //this.validate()

    // Step #2: Apenas caso não tenha erro de validação
if (!this.errors.length) {
    //chatCollection.insertOne(this.msg)
}}


/*let chat = new Chat()
validateCNPJ('12345')
console.log(chat);
*/
module.exports = Chat