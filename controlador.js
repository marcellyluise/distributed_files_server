
//HTTP
var http = require('http');
var url = require('url');
var dadosCompartilhados = require('./mod/dados');
    dadosCompartilhados.push({broadcastAddress: '192.168.0.255'});
    dadosCompartilhados.push({qtd:0});
    dadosCompartilhados.push({usuarios: [{ cod: 0, ip:'0', usuario:'0'}] });
var v_cod = 1;


//
setInterval(() => {
    var vc = require('./mod/verificaConexoes');
    vc.verificaConexoes();
  }, 7000);

//iniciando o servidor http
var serverHTTP = http.createServer(onRequest).listen(8080);
//apenas para testes no mesmo computador, vamos criar um servidor na porta8080
//e outro na porta8081.
serverHTTP.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
        console.log('Erro na criação do Servidor Web na porta 8080 - tentando criar na 8081.');
        var serverHTTP = http.createServer(onRequest).listen(8081);
        console.log('Provavel sucesso na criação do servidor Web na porta 8081.');
    }
});

console.log('Servidor iniciado');

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

//Conexão UDP - identifica novos pares na rede...

var PORT = 8080;
var PORT2 = 8081;
//var HOST = '172.20.10.15'; - funciona com a rede do meu telefone
 // deve fazer broadcast em qualquer rede...
var mapa = {};

var dgram = require('dgram');
var serverUDP = dgram.createSocket('udp4');
var serverUDP2 = dgram.createSocket('udp4');
var i = 1;

console.log ('chegou aqui');

serverUDP.on('listening', function () {
    var address = serverUDP.address();
    serverUDP.setBroadcast(true);
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

serverUDP.on('message', function (message, remote) {
   //recebeu mensagem broadcast udp
   //verifica se o ip recebido já está registrado
   if ( typeof dadosCompartilhados[2]['usuarios'].find(o => o.ip === remote.address) === 'undefined') {
       //fará a inclusão ip no objeto de usuários
       dadosCompartilhados[2]['usuarios'].push({ cod: v_cod, ip: remote.address, usuario: '' +message+''});
   } else {
       console.log('Recebeu pedido de conexao udp com ip repetido...');
   }
   
    console.log('Usuario do endereço ' + remote.address + ':' + remote.port +' -  enviou mensagem: ' + message);

});

serverUDP.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
    console.log('Esta é a segunda instancia... Não vou iniciar um servidor udp aqui...');
    }
}
);

console.log(dadosCompartilhados[0]);
serverUDP.bind(8080,dadosCompartilhados[0]['broadcastAddress']);
console.log('processo id:' + process.pid);