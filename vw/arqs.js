
var fs = require('fs');
exports.arqs = arqs;

function arqs(response) {
    fs.readFile('./pages/arqs.html', 
    function(error, data) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    }
    );
}