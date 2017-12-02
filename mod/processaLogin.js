var qs = require('querystring');
var dgram = require('dgram');


exports.processaLogin = processaLogin;


function processaLogin(request, response) {
    var body = '';
    request.on ('data', function (data) {
    body += data;
    });
    request.on ('end', function() {
        var post = qs.parse(body);
        var vw = require('../vw/arqs');
        console.log('login de ' + post['nome']);
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('Bem vindo ' + post['nome']);
        vw.arqs(response);
        response.end();
    });
}
