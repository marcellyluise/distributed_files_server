
//HTTP
var http = require('http');
var url = require('url');
var dadosCompartilhados = require('./mod/dados');
    //dadosCompartilhados.push({broadcastAddress: '192.168.0.255'});
    dadosCompartilhados.push({broadcastAddress: '172.20.10.15'});
    dadosCompartilhados.push({qtd:0});
    dadosCompartilhados.push({usuarios: [{ cod: 0, ip:'127.0.0.1', usuario:'localhost', online: 'N'}] });
var v_cod = 1;

////////////////////////////////////////////////////////
// 1. Obtem o ip do computador local na rede  e verifica se há conexão de rede...
////////////////////////////////////////////////////////

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
var meuIP = addresses[0];
if (typeof meuIP === 'undefined') {
    console.log ('Não há conexão de rede!');
    process.exit(0);
}
console.log('Rede ok. Meu ip:' + meuIP);


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
server.listen('9090', meuIP);

/////////////////////////////////////////////////////////////////////////
//função que, de tempos em tempos verifica se os computadores continuam conectados
/////////////////////////////////////////////////////////////////////////
setInterval(() => {
    var vc = require('./mod/verificaConexoes');
    vc.verificaConexoes();
  }, 7000);

//////////////////////////////////////////////////////////////////////////
//Servidor HTTP - controla a aplicação local na porta 8080
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
//SERVIDOR UDP - Para escutar broadcast de novos computadores 
//               querendo se conectar à aplicacao
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
console.log('Local process id:' + process.pid);