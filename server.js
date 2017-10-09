var httpModule = require('http');
var fileSystemModule = require('fs');

httpModule.createServer(
  function (request, response){

    fileSystemModule.readFile('./pages/authentication.html', 
      function(error, data){
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
      }
    );
  }
).listen(8080);