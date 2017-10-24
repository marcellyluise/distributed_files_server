var dadosCompartilhados = require('../mod/dados.js');
exports.verificaConexoes = verificaConexoes;

function verificaConexoes () {
    console.log('Verificando Conexoes:' );
    console.log(dadosCompartilhados[2]['usuarios']);
}

