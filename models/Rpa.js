const puppeteer = require("puppeteer")

let RPA = function(msg){
  this.msg = msg
}

function converteValor(valor) {
  //Remove os pontos e virgula e converte em numeros
  const numValor = Number(valor.replace(/[.,]/g, ''));

  //Formata em string com os 3 zeros
  const valorFormatado = numValor.toLocaleString('en-US', {
    minimumIntegerDigits: 3,
    useGrouping: false
  });
  return valorFormatado;
}

RPA.prototype.acessarSite = async function (chat){

    let browser = await puppeteer.launch();
    let page = await browser.newPage();

    await page.goto('https://nfe.prefeitura.sp.gov.br/mobile/senhaweb/login.aspx')
    await page.screenshot({path:'./testes/paginaInicial.png'})

    await page.type('#ctl00_cphBase_ctrlActionCpfCnpj_ctrlCpfCnpj_tbCpfCnpj', chat.username);
    await page.type('#ctl00_cphBase_ctrlActionSenha_tbText', chat.password);
    

    //Click for button "Login"
    const [response1] = await Promise.all([
        page.waitForNavigation(), // The promise resolves after navigation has finished
        await page.click('#ctl00_cphBase_btLogin') // Clicking the link will indirectly cause a navigation
      ]);
    await page.screenshot({path: './testes/Logado.png'})      

    //Clicking for "Emissão Nota" on the menu  
    const [response2] = await Promise.all([
        page.waitForNavigation(), // The promise resolves after navigation has finished
        await page.click('#ctl00_cphBase_ctrlMenuContribOpcoes_ctrlMenuContribOpcoes_CellMenuItem0_MenuItem_lnk') // Clicking the link will indirectly cause a navigation
      ]); 
    console.log("Clicou no 'Emissao Nota'")  

    //Typing the Tomador
    page.waitForNavigation()
    await page.type('#ctl00_cphBase_ctrlCpfCnpjTomador_ctrlCpfCnpj_tbCpfCnpj', chat.tomador);  
    console.log("Digitou 'Tomador'") 

    //Typing Descricao
    await page.type('#ctl00_cphBase_ctrlTextDiscriminacao_tbText', chat.descricao);  
    console.log("Digitou 'Descricao'") 

    //Typing Valor
    await page.type('#ctl00_cphBase_ctrlTextValor_tbText', converteValor(chat.valor));  
    console.log("Digitou 'Valor'")     
    await page.screenshot({path: './testes/emissao.png'})

    
    //Clicou no "EMITIR"  
    page.on('dialog', async dialog => {
      console.log(dialog.message());
      await dialog.accept();
  });
  
  await Promise.all([
      page.waitForNavigation(),
      page.evaluate(() => {
          document.querySelector('#ctl00_cphBase_btEmitir').click();
      })
  ]);

    console.log("Clicou no Emitir")
  
    await page.screenshot({path: './testes/emitido.png'})
    await browser.close()   
    console.log("FIM")  
}
module.exports = RPA