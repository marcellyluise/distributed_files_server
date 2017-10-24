var qs = require('querystring');
var dgram = require('dgram');
var dadosCompartilhados = require('../mod/dados.js');


exports.processaLogin = processaLogin;



function processaLogin(request, response) {
    var body = '';
    request.on ('data', function (data) {
    body += data;
    });
    request.on ('end', function() {
        var post = qs.parse(body);
        console.log(post['nome']);
        
        //var broadcastAddress = "255.255.255.255";
        
        var message = new Buffer(post['nome']);
        
        var client = dgram.createSocket({type:"udp4",reuseAddr:true});
        client.bind();
        client.on("listening", function () {
            client.setBroadcast(true);
            client.send(message, 0, message.length, 8080, dadosCompartilhados[0]['broadcastAddress'], function(err, bytes) {
                client.close();
            });
        });

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('Bem vindo ' + post['nome']);
        response.end();
    });
}
