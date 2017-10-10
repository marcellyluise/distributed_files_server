var http = require("http");

http.createServer(
    function(request,response) {
        response.writeHead(200,{"Content-Type": "text/html"});
        response.write("<html>");
        response.write("<head><meta charset=\"UTF-8\" ><title>Node.js</title></head>");
        response.write("<body><p>Servidor de Arquivos P2P</p></body>");
        response.write("</html>");
        response.end();
    }
).listen(8080);

var PORT = 8080;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var server = dgram.createSocket('udp4');

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);

});

server.bind(PORT, HOST);
