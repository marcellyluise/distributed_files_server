var net = require('net');
var server = net.createServer();
var retorno;

exports.verificaPorta = verificaPorta;

function verificaPorta(porta) {

    server.listen(porta);
    return retorno;

}

server.once('error', function(err) {
  if (err.code === 'EADDRINUSE') {
    retorno = false;
  }
});

server.once('listening', function() {
  
  // close the server if listening doesn't fail
  server.close();
  retorno = true;

});

