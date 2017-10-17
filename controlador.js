var http = require('http');
var url = require('url');

//iniciando o servidor http
var serverHTTP = http.createServer(onRequest).listen(8080);
//apenas para testes no mesmo computador, vamos criar um servidor na porta8080
//e outro na porta8081.
serverHTTP.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
        console.log('entrou aqui');
        var serverHTTP = http.createServer(onRequest).listen(8081);
        console.log('entrou no segundo http aqui');
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



/*iniciando uma escuta por broadcast udp tambem
var SRC_PORT = 8080;
var PORT = 8080;
var MULTICAST_ADDR = '192.168.0.255';
var dgram = require('dgram');
var server = dgram.createSocket("udp4");

server.bind(SRC_PORT, function () {
    setInterval(multicastNew, 4000);
});

function multicastNew() {
    var message = new Buffer("Multicast message!");
    server.send(message, 0, message.length, PORT, MULTICAST_ADDR, function () {
        console.log("Sent '" + message + "'");
    });
} */

var PORT = 8080;
var PORT2 = 8081;
var HOST = '172.20.10.15';
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
    console.log('Usuario do endereço ' + remote.address + ':' + remote.port +' -  enviou mensagem: ' + message);
    mapa[''+ message+''] = [remote.address,remote.port,''+ message+''];
    //mapa[i++] = remote.address;
    //mapa[i++] = remote.port;
    //mapa[i++] = message;
    console.log(mapa);
});

serverUDP.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
    console.log('Esta é a segunda instancia... Não vou iniciar um servidor udp aqui...');
    }
}
);

serverUDP.bind(8080,HOST);
console.log(process.pid);