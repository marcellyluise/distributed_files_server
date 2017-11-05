
    
var oData = require('./oData');
console.log('Local process id:' + process.pid);



////////////////////////////////////////////////////////////////////////////////
// 1. Obtem o ip do computador local na rede  e verifica se há conexão de rede...
////////////////////////////////////////////////////////////////////////////////

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

oData['myIP'] = addresses[0];
if (typeof oData['myIP'] === 'undefined') {
    console.log ('No network found!');
    process.exit(0);
}
console.log('Network ok. MyIP:' + oData['myIP']);
console.log(oData);


////////////////////////////////////////////////////////////////////////////////
// 2.  Ao iniciar a aplicação, inicializa o servidor UDP, para escutar sobre 
//     outros nós entrando 
////////////////////////////////////////////////////////////////////////////////

var dgram = require('dgram');
var serverUDP = dgram.createSocket('udp4');

serverUDP.on('listening', function () {
    console.log('até aqui...');
    var address = serverUDP.address();
    serverUDP.setBroadcast(true);
    console.log('UDP Server listening for broadcasts on ' + address.address + ":" + address.port);
});

serverUDP.on('message', function (message, remote) {
   //recebeu mensagem broadcast udp
   //conecta com o outro par via tcp
   console.log('Vai estabelecer a conexão TCP com o outro computador!');
   
/*   
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
*/

});

serverUDP.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
    console.log('Erro na inicialização do servidor UDP.');
    }
}
);

serverUDP.bind(8080,'192.168.0.255');


var client = dgram.createSocket({type:"udp4",reuseAddr:true});
client.bind();
client.on("listening", function () {
    client.setBroadcast(true);
    client.send('teste', 0, 'teste'.length, 8080, '192.168.0.255', function(err, bytes) {
        client.close();
    });
});


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