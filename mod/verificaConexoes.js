var dadosCompartilhados = require('../mod/dados.js');
exports.verificaConexoes = verificaConexoes;

function verificaConexoes () {
    console.log('\r\nVerificando Conexoes:' );

    var net = require('net');
    var i=0;
    
    for (var key in dadosCompartilhados[2]['usuarios']) {
        
        var client = new net.Socket();
        client.connect(9090, dadosCompartilhados[2]['usuarios'][i]['ip'], function() {
        console.log('Connected with ' + client.remoteAddress);
        dadosCompartilhados[2]['usuarios'][i]['online'] = 'S';
        i++;
        });

        client.on('data', function(data) {
            console.log('Received: ' + data);
            client.destroy(); // kill client after server's response
        });
    
        client.on('close', function() {
            console.log('Connection closed!');
        });

        client.on('error', function(err) {
            if (err.code === 'EADDRINUSE') {
            console.log('Erro na inicialização do servidor UDP.');
            }
            dadosCompartilhados[2]['usuarios'].splice(i,1);
        });
    }

    console.log(dadosCompartilhados[2]['usuarios']);
}

