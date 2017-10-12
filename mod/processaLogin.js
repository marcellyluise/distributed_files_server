var qs = require('querystring');
exports.processaLogin = processaLogin;

function processaLogin(request, response) {
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
}
