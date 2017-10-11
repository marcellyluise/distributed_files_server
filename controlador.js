var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs = require('fs');

http.createServer(onRequest).listen(8080);
console.log('Servidor iniciado');

function onRequest(request,response) {
    
    var pathName = url.parse(request.url).pathname;
    
    if (pathName=='/') {
        fs.readFile('./pages/login.html', 
            function(error, data) {
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.write(data);
                response.end();
            }
        );
    } else if (pathName=='/login' && request.method == 'POST') {
        var body = '';
        request.on ('data', function (data) {
        body += data;
        });
        request.on ('end', function() {
            var post = qs.parse(body);
            console.log(post['nome']);
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(post['nome']);
            response.end();
        });
    } else {

        console.log('caminho: ' + pathName);
        response.write('Caminho: ' + pathName);
        response.end();

    }
}



