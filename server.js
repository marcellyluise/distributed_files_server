
var httpModule = require('http');
var fileSystemModule = require('fs');
var urlModule = require('url');

httpModule.createServer(
  function (request, response){
    console.log(request);
    fileSystemModule.readFile('./pages/authentication.html', 
      function(error, data){
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);

        var address = request.url;
        var query = urlModule.parse(address, true);

        response.end();
      }
    );
  }

).listen(8080);