
var fs = require('fs');
exports.login = login;

function login(response) {
    fs.readFile('./pages/login.html', 
    function(error, data) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    }
    );
}