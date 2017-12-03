
var fs = require('fs');
var net = require('net');
var http = require('http');
var url = require('url');
var qs = require('querystring');
var os = require('os');
var dgram = require('dgram');


var stringify = require('./stringify');


var arquivos = [];
arquivos.push({ path: ['dir1','dir2'], name:'arq.txt', file_length: 6, bin: '012345', owner: 'claiton' });

var usuario = '';


////////////////////////////////////////////////////////////////////////////////////
// 1. Obtem o ip do computador local na rede  e verifica se há conexão de rede...
////////////////////////////////////////////////////////////////////////////////////
var myIP = '';
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
var conexoes = [];
var dadosConexoes = [];

// Start a TCP Server
net.createServer(function (socket) {

  // Identifica a conexao que está sendo iniciada
  socket.name = socket.remoteAddress.match('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+') + ":" + socket.remotePort 
  // Insere o computador na lista de conexoes
  conexoes.push(socket);
  // Avisa ao computador para adicionar esta conexao na lista dele também 
  socket.write('>ADD ' + socket.name + "\n");
  
  // Gerencia mensagens que chegam dos outros computadores
  socket.on('data', function (data) {
     gerenciaMensagensRecebidas(data,socket.name); 
  });

  // Remove the client from the list when it leaves
  socket.on('end', function () {
    console.log(conexoes.indexOf(socket) + ' vai desconectar!');  
    conexoes.splice(conexoes.indexOf(socket), 1);
    console.log(socket.name + " desconectou.\n");
  });
  

}).listen(5000);

function gerenciaMensagensRecebidas (data, origem) {
    console.log(myIP +' <-> '+ origem + " - Mensagem > " + data);
    console.log('Qtd de conexões: ' + conexoes.length);
}


// Put a friendly message on the terminal of the server.
console.log("Servidor TCP running at port 5000\n");


////////////////////////////////////////////////////////////////////////////////
// 3.  Inicializa o servidor UDP, para escutar sobre 
//     outros nós entrando, e, ao receber a mensagem, conecta em TCP
////////////////////////////////////////////////////////////////////////////////


var serverUDP = dgram.createSocket('udp4');

serverUDP.on('listening', function () {
    var address = serverUDP.address();
    serverUDP.setBroadcast(true);
    console.log('UDP Server listening for broadcasts on ' + address.address + ":" + address.port);
});

serverUDP.on('message', function (message, remote) {
   //recebeu mensagem broadcast udp 
   //conecta com o outro par via tcp  
   serverUDP.send('Emitindo resposta.... conecte comigo...',8080,remote.address);
 
   if (remote.address!=myIP) {

        //console.log('Estabelecendo conexão com ' + remote.address + ':5000');
        var oclient = new net.Socket();
        oclient.connect(5000, remote.address, function() {
            //console.log(myIP + ':' + this.port + ' <-> ' + remote.address + ':5000');
            //oclient.write('Conexão estabelecida!'  );
        });
        
        oclient.on('data', function(data) {
            if (data.indexOf('ADD')===1) {
                // Identifica a conexao que está sendo iniciada
                oclient.name = oclient.remoteAddress.match('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+') + ":" + oclient.remotePort; 
                conexoes.push(this);
                console.log(myIP +' <-> '+ oclient.name + " - Mensagem > " + data);
                console.log('Qtd de conexões: ' + conexoes.length);
            } else {
                gerenciaMensagensRecebidas(data,this.name);
            }
        });
        
        oclient.on('close', function(oCon) {
            console.log(conexoes.indexOf(oCon) );
            conexoes.splice(conexoes.indexOf(oCon), 1);
            console.log('Connection closed');
            console.log('Qtd de conexões: ' + conexoes.length);
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
            console.log('login de ' + post['nome']);
            
            //registra o usuario
            usuario = post['nome'];
            fs.readFile('./pages/arqs.html', 
            function(error, data) {
                response.writeHead(200, {'Content-Type': 'text/html'});
                //processa substituições
                data = replaceAll(String(data),'[[[usuario]]]', usuario);
                data = replaceAll(data,'[[[conexoes]]]', stringify(arquivos));
                response.write(data);
                response.end();
            });
        });

    } else if (pathName=='/upload' && request.method == 'POST') {
        
        //Obtem a string que limita o arquivo que está sendo feito upload
        //var limites = qs.parse(request.headers['content-type'],'; ','=');
        //console.log(limites);
        
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

            console.log('---nome do arquivo---');
            console.log(dadosArq[1]['filename']);
           
            //obtem o corpo do arquivo e converte para texto em base64           
            console.log('---arquivo---'); 
            arquivo = body.substring( body.indexOf('\r\n\r\n')+4,body.indexOf(dadosArq[0],20)-2);
            
            //console.log(arquivo);
            //var strarq = new Buffer(arquivo, 'binary').toString('base64');
            //console.log(strarq);


            var novoArquivo ={        path: ['/'], 
                                   name: replaceAll(dadosArq[1]['filename'],'"',''), 
                            file_length: arquivo.length, 
                                    bin: arquivo, 
                                  owner: usuario 
                           };

            //atualiza a lista local
            arquivos.push(novoArquivo);               

            //atualiza as listas remotas
            broadcast('>UPL ' + novoArquivo);

           // console.log(body);
           // var post = qs.parse(body,'\n',':');
           // console.log('nome do arquivo:' + );
            
            
           fs.readFile('./pages/arqs.html', 
           function(error, data) {
               response.writeHead(200, {'Content-Type': 'text/html'});
               //processa substituições
               data = replaceAll(String(data),'[[[usuario]]]', usuario);
               data = replaceAll(data,'[[[arquivos]]]', replaceAll(stringify(arquivos),'},{','}\n,{')) ;
               
               
               response.write(data);
               response.end();
           });
       });

    } else {
       // vamos colocar um erro 404 aqui...
        console.log('caminho: ' + pathName);
        response.write('Caminho: ' + pathName);
        response.end();
    }
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

/* Envia novidades para todos os conectados */
function broadcast(message) {
    conexoes.forEach(function (conexao) {
      conexao.write(message);
    });
    
    process.stdout.write(message)
  } 

////////////////////////////////////////////////////////////////////////////////
// 1. Obtem o ip do computador local na rede  e verifica se há conexão de rede...
////////////////////////////////////////////////////////////////////////////////
/*
var os = require('os');
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
dadosCompartilhados[0]['meuIP'] = addresses[0];
if (typeof dadosCompartilhados[0]['meuIP'] === 'undefined') {
    console.log ('Não há conexão de rede!');
    process.exit(0);
}
console.log('Rede ok. Meu ip:' + dadosCompartilhados[0]['meuIP']);


//////////////////////////////////////////////////////////////////
// 2. Cria servidor tcp para controlar a lista de arquivos e conexões
//////////////////////////////////////////////////////////////////
var net = require('net');
var server = net.createServer(function(socket) {
    socket.on('data', function(data) {
        console.log ('Dados: ' + socket.remoteAddress + ': ' + data);
        socket.write ('Dados Recebidos');
    });

});
server.on('listening', function () {
    console.log (' Servidor TCP listening... ');
});
server.listen('9090', dadosCompartilhados[0]['meuIP']);


/////////////////////////////////////////////////////////////////////////
//3. função que, de tempos em tempos verifica se os computadores continuam conectados
/////////////////////////////////////////////////////////////////////////
setInterval(() => {
    var vc = require('./mod/verificaConexoes');
    vc.verificaConexoes();
  }, 15000);

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
console.log('Servidor HTTP - para a aplicação local - iniciado.');

function onRequest(request,response) {
    
    var pathName = url.parse(request.url).pathname;
    
    if (pathName=='/') {
        var vw = require('./vw/login');
        vw.login(response);

    } else if (pathName=='/login' && request.method == 'POST') {
        var mod = require('./mod/processaLogin');
        mod.processaLogin(request,response);

    } else {
       // vamos colocar um erro 404 aqui...
        console.log('caminho: ' + pathName);
        response.write('Caminho: ' + pathName);
        response.end();
    }
}


//////////////////////////////////////////////////////////////
//5. SERVIDOR UDP - Para escutar broadcast de novos computadores 
//                  querendo se conectar à aplicacao
//////////////////////////////////////////////////////////////

var PORT = 8080;
var mapa = {};
var dgram = require('dgram');
var serverUDP = dgram.createSocket('udp4');

serverUDP.on('listening', function () {
    var address = serverUDP.address();
    serverUDP.setBroadcast(true);
    console.log('UDP Server listening for broadcasts on ' + address.address + ":" + address.port);
});

serverUDP.on('message', function (message, remote) {
   //recebeu mensagem broadcast udp
   //verifica se o ip recebido já está registrado
   if ( typeof dadosCompartilhados[2]['usuarios'].find(o => o.ip === remote.address) === 'undefined') {
       //fará a inclusão ip no objeto de usuários
       dadosCompartilhados[2]['usuarios'].push({ cod: v_cod++, 
                                                  ip: remote.address, 
                                                  usuario: '' +message+'',
                                                  online: 'N' });
   } else {
       console.log('Recebeu pedido de conexao udp com ip repetido...');
   }
   
    console.log('Usuario do endereço ' + remote.address + ':' + remote.port +' -  enviou mensagem: ' + message);

});

serverUDP.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
    console.log('Erro na inicialização do servidor UDP.');
    }
}
);

serverUDP.bind(8080,dadosCompartilhados[0]['broadcastAddress']);
console.log('Local process id:' + process.pid); */