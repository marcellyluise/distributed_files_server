var PORT = 8080;
var HOST = '127.0.0.1';

var dgram = require('dgram');
var message = new Buffer('Vamos tentar agora sem HOST');

var client = dgram.createSocket('udp4');
client.send(message, 0, message.length, PORT,  function(err, bytes) {
    if (err) throw err;
    console.log('UDP message enviada para a porta: '+ PORT);
    client.close();
});