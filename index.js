var fs = require('fs');
var net = require('net');
var http = require('http');
var url = require('url');
var qs = require('querystring');
var os = require('os');
var dgram = require('dgram');

var stringify = require('./stringify');

//identifica o usuario que vai logar nesta instancia
//se for o caso...
var usuario = '';

//lista de arquivos que estão carregados no servidor
var arquivos = [];

//modelo da lista de arquivos...
//arquivos.push({ path:'/', name:'arq.txt', file_length: 6,  owner: 'claiton' });

//corpo dos arquivos
var corpoArquivo = [];

//lista de conexões que estão ativas 
var conexoes = [];

//endereço ip desta instancia
var myIP = '';

//lista inicial de arquivos
var solicitouLista = false;




////////////////////////////////////////////////////////////////////////////////////
// 1. Obtem o ip do computador local na rede  e verifica se há conexão de rede...
////////////////////////////////////////////////////////////////////////////////////
var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}

myIP = addresses[0];
if (typeof myIP === 'undefined') {
    console.log ('No network found!');
    process.exit(0);
}
console.log('Network ok. \nMyIP:' + myIP);



////////////////////////////////////////////////////////////////////////////////
// 2. Inicializa um servidor TCP que vai estabelecer conexao com os outros 
//    na porta 5000
////////////////////////////////////////////////////////////////////////////////

// Start a TCP Server
net.createServer(function (socket) {

  // Identifica a conexao que está sendo iniciada
  socket.name = socket.remoteAddress.match('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+') + ":" + socket.remotePort 
  // Insere o computador na lista de conexoes
  conexoes.push(socket);
  // Avisa ao computador para atualizar a lista de arquivos, se não pediu ainda...
  if (!solicitouLista) {
       escreve(socket, '>LIS ' + socket.name );
       solicitouLista = true;
  } else {
       escreve(socket, '>OK! ' + socket.name );
  }
  
  // Gerencia mensagens que chegam dos outros computadores
  socket.on('data', function (data) {
     gerenciaMensagensRecebidas(data,socket.name, socket); 
  });

  // Remove the client from the list when it leaves
  socket.on('end', function () {
    console.log(conexoes.indexOf(socket) + ' vai desconectar!');  
    conexoes.splice(conexoes.indexOf(socket), 1);
    console.log(socket.name + " desconectou.\n");
  });
  

}).listen(5000);



//Avisa que o servidor TCP está escutando...
console.log("Servidor TCP executando na porta 5000\n");


////////////////////////////////////////////////////////////////////////////////
// 3.  Inicializa o servidor UDP, para escutar sobre 
//     outros nós entrando, e, ao receber a mensagem, conecta em TCP
////////////////////////////////////////////////////////////////////////////////


var serverUDP = dgram.createSocket('udp4');

serverUDP.on('listening', function () {
    var address = serverUDP.address();
    serverUDP.setBroadcast(true);
    console.log('UDP Server escutando broadcasts em ' + address.address + ":" + address.port);
});

serverUDP.on('message', function (message, remote) {
   //recebeu mensagem broadcast udp 
   //conecta com o outro par via tcp  
   serverUDP.send('Emitindo resposta.... conecte comigo...',8080,remote.address);
 
   if (remote.address!=myIP) {

        //console.log('Estabelecendo conexão com ' + remote.address + ':5000');
        var oclient = new net.Socket();
        oclient.connect(5000, remote.address, function() {
            //connecta e nomeia o socket
            oclient.name = oclient.remoteAddress.match('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+') + ":" + oclient.remotePort;
            conexoes.push(this);
            escreve(oclient, '>OK!');
        });
        
        oclient.on('data', function(data) {
                gerenciaMensagensRecebidas(data,this.name, this);
        });
        
        oclient.on('close', function(oCon) {
            //console.log(conexoes.indexOf(oCon) );
            conexoes.splice(conexoes.indexOf(oCon), 1);
            console.log('Encerra conexao');
        });
       
    }

});

serverUDP.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
    console.log('Erro na inicialização do servidor UDP.');
    }
}
);

serverUDP.bind(8080,'172.20.10.15');
//serverUDP.bind(8080,'255.255.255.255');

var client = dgram.createSocket({type:"udp4",reuseAddr:true});
client.bind();
client.on("listening", function () {
    client.setBroadcast(true);
    client.send('Ola', 0, 'Ola'.length, 8080, '172.20.10.15', function(err, bytes) {
        client.close();
    });
});


//////////////////////////////////////////////////////////////////////////
//4. Servidor HTTP - controla a aplicação local na porta 8080
//////////////////////////////////////////////////////////////////////////

var serverHTTP = http.createServer(onRequest).listen(8080);
serverHTTP.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
        console.log('Erro na criação do Servidor Web na porta 8080 - tentando criar na 8081.');
        var serverHTTP = http.createServer(onRequest).listen(8081);
        console.log('Provavel sucesso na criação do servidor Web na porta 8081.');
    }
});
console.log('Servidor HTTP - para a aplicação local na porta 8080 - iniciado.');

function onRequest(request,response) {
    
    var pathName = url.parse(request.url).pathname;
    
    if (pathName=='/') {
        fs.readFile('./pages/login.html', 
        function(error, data) {
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(data);
            response.end();
        }
        );

    } else if (pathName=='/login' && request.method == 'POST') {
        var body = '';
        request.on ('data', function (data) {
        body += data;
        });
        request.on ('end', function() {
            var post = qs.parse(body);
            var erroLogin = '';
            console.log('login de ' + post['nome']);
            
            //registra o usuario
            usuario = replaceAll(replaceAll(post['nome'],'\r',''),'\n','');
            fs.readFile('./pages/arqs.html', 
            function(error, data) {
                response.writeHead(200, {'Content-Type': 'text/html'});
                //processa substituições
                data = replaceAll(String(data),'[[[erro]]]', erroLogin);
                data = replaceAll(String(data),'[[[usuario]]]', usuario);
                data = replaceAll(data,'[[[arquivos]]]', formataTabelaArquivos());
                response.write(data);
                response.end();
            });
        });

    } else if (pathName=='/upload' && request.method == 'POST') {
        
        //Obtem a string que limita o arquivo que está sendo feito upload
        //var limites = qs.parse(request.headers['content-type'],'; ','=');
        //console.log(limites);
        console.log(request.headers);
        
       // if (typeof request.headers['content-lenght']!=undefined ) {
       //     var body = Buffer.allocUnsafe(request.headers['content-length']);
       // }
           //Junta as partes do arquivo na variável body
        var body = '';


        request.on ('data', function (data) {
        body += data;
        });

       
        request.on ('end', function() {
            
            //terminou o upload...
            //separa o cabeçalho do arquivo, do corpo
            var dadosArq = body.split('\r\n\r\n',1);

            //trata o cabeçalho, até chegar ao nome do arquivo...
            dadosArq = dadosArq[0].split('\r\n',3);
            dadosArq[1] = qs.parse(dadosArq[1], '; ','=');
            console.log(dadosArq[0]);

            //console.log('->Upload de arquivo:' + dadosArq[1]['filename']);
            //console.log(dadosArq[1]['filename']);
           
            //obtem o corpo do arquivo e converte para texto em base64           
            //console.log('---arquivo---'); 
            arquivo = body.substring( body.indexOf('\r\n\r\n')+4,body.indexOf(dadosArq[0],20)-2);
            
            //console.log(arquivo);
            //var strarq = new Buffer(arquivo, 'binary').toString('base64');
            //console.log(strarq);


            var novoArquivo ={        path: '/', 
                                   name: replaceAll(dadosArq[1]['filename'],'"',''), 
                            file_length: arquivo.length, 
                                  owner: usuario 
                           };

            var erroArquivo = '';               
            
            //verifica erros
            //1. O arquivo está vazio?
            if (arquivo.length===0) {
                erroArquivo = 'Atualizando dados...';
            }
            
            //2. O arquivo já existe?
            var picked = arquivos.find(o => o['name'] === novoArquivo['name'] && o['owner'] === novoArquivo['owner']);
            if (typeof picked !== 'undefined') {
                erroArquivo = 'Arquivo duplicado! - Selecione outro! ';
            }

            //console.log(picked);
            if (erroArquivo==='') {
                //atualiza a lista local
                arquivos.push(novoArquivo);               

                //atualiza as listas remotas
                broadcast('>UPL ' + JSON.stringify(novoArquivo));
            }

           // console.log(body);
           // var post = qs.parse(body,'\n',':');
           // console.log('nome do arquivo:' + );

           
           var txt = formataTabelaArquivos();
            
            
           fs.readFile('./pages/arqs.html', 
           function(error, data) {
               
               response.writeHead(200, {'Content-Type': 'text/html'});
               
               //processa substituições
               data = replaceAll(String(data),'[[[usuario]]]', usuario);
               data = replaceAll(String(data),'[[[erro]]]', erroArquivo);
               //data = replaceAll(data,'[[[arquivos]]]', replaceAll(stringify(arquivos),'},{','}\n,{')) ;
               data = replaceAll(data,'[[[arquivos]]]', txt) ;
               
               
               response.write(data);
               response.end();
           });
       });

    } else if (pathName=='/delete' && request.method == 'POST') {
        
        var body = '';
        request.on ('data', function (data) {
        body += data;
        });
        request.on ('end', function() {
            var post = qs.parse(body);
            var erroLogin = '';
            console.log(post);
            var donoArquivo = post['submitbutton'].substring(4,post['submitbutton'].indexOf('_',5));
            //console.log(donoArquivo);
            var nomeArquivo = post['submitbutton'].substring(post['submitbutton'].indexOf('_',5)+1);
            nomeArquivo = replaceAll(nomeArquivo,'\n','');
            nomeArquivo = replaceAll(nomeArquivo,'\r','');
            //console.log(nomeArquivo);

            var erroDelete = '';
            var picked = arquivos.find(o => o['name'] === nomeArquivo && o['owner'] === donoArquivo);
            if (typeof picked !== 'undefined') {
                arquivos.splice(arquivos.indexOf(picked), 1);
                broadcast('>DEL ' + stringify(picked));
            } else {
                erroDelete = 'Arquivo não foi encontrado! ';
            }

            
            fs.readFile('./pages/arqs.html', 
            function(error, data) {
                response.writeHead(200, {'Content-Type': 'text/html'});
                //processa substituições
                data = replaceAll(String(data),'[[[erro]]]', erroDelete);
                data = replaceAll(String(data),'[[[usuario]]]', usuario);
                data = replaceAll(data,'[[[arquivos]]]', formataTabelaArquivos());
                response.write(data);
                response.end();
            });
        });

    }  else {
       // vamos colocar um erro 404 aqui...
        console.log('caminho: ' + pathName);
        response.write('Caminho: ' + pathName);
        response.end();
    }
}

//////////////////////////////////////////////////////////////////////////
//5. Protocolo - Executa ações a partir de mensagens recebidas
//////////////////////////////////////////////////////////////////////////

function gerenciaMensagensRecebidas (data, origem, socket) {
    //Pode haver mais de uma mensagem em uma transferencia de dados
    //então quebra as mensagens usando o separador |-|-|

    var vData = data.toString('utf8').split('|-|-|'); 
    
    //Executa ações para cada mensagem recebida
    vData.forEach(function (ldata) {
        var tipo = ldata.toString('utf8').substring(0,4);
        switch (tipo) {
            case '>LIS':
            //Essa mensagem é mandada quando um computador se conecta ao grupo
            //é um pedido para atualizar a lista de arquivos, o que é feito com uma
            //sequencia de mensagens UPL (upload)
            if (arquivos.length>0) {
                arquivos.forEach(function (arquivo) {
                    escreve(socket, '>UPL '+ stringify(arquivo));
                });
            }
            break;
            
            case '>UPL':
            //aviso de arquivo adiconado - adicona esse arquivo na lista de arquivos - se já não existir
            var arquivorecebido = JSON.parse(ldata.toString('utf-8').substring(5));
            if (arquivos.indexOf(arquivorecebido)<0) {
                arquivos.push(arquivorecebido);
            }
            break;
            
            case '>DEL':
            //aviso de arquivo apagado - retira esse arquivo da lista de arquivos
            var arquivoAApagar = JSON.parse(ldata.toString('utf-8').substring(5));

            var picked = arquivos.find(o => o['name'] === arquivoAApagar['name'] && o['owner'] === arquivoAApagar['owner']);
            if (typeof picked !== 'undefined') {
                arquivos.splice(arquivos.indexOf(picked), 1);
             } 
            break;
            default:
        }
    });

    //console.log(myIP +' <-> '+ origem + " - Mensagem " + data);
    console.log('Qtd de conexões: ' + conexoes.length);
}

//////////////////////////////////////////////////////////////////////////
//5. Funções menores, para ajudar nas tarefas do programa
//////////////////////////////////////////////////////////////////////////

//substitui todas as ocorrencias de um conjunto de caracteres em uma string
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

//usada na função acima...
function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

// Envia uma mensagem para todos os sockets do vetor de conexões
function broadcast(message) {
    conexoes.forEach(function (conexao) {
      escreve(conexao,message);
    });
  } 

// Escreve uma mensagem, terminando-a com o separador que padronizamos: |-|-|
  function escreve(socket, mensagem) {
      socket.write(mensagem + '|-|-|');
  }

 // Converte o Json de Arquivos em uma tabela HTML e inclui botões para apagar os arquivos 
  function formataTabelaArquivos() {
    var txt = ' <form action="/delete" method="post" enctype="text/plain"> <table border="1"> \n';
    txt += "<tr> <th> Caminho </th> <th> Nome </th> <th> Tamanho </th> <th>Proprietário</th><th>Ação</th> </tr>\n";
    for (x in arquivos) {
        txt += "<tr><td>" + arquivos[x].path + "</td><td>" + 
                            arquivos[x].name + "</td><td>" + 
                            arquivos[x].file_length + "</td><td>" +
                             arquivos[x].owner + " </td><td>" + 
                             '<button type="submit" name="submitbutton" value="DEL_' + arquivos[x].owner + '_' + arquivos[x].name +'"> Apagar </button>\n' +
                            "</td></tr>\n";
    }
    txt += "</table></form>";
    return txt;
  }