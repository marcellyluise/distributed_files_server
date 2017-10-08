var http = require("http");

http.createServer(
    function(request,response) {
        response.writeHead(200,{"Content-Type": "text/html"});
        response.write("<html>");
        response.write("<head><meta charset=\"UTF-8\" ><title>Node.js</title></head>");
        response.write("<body><p>Servidor de Arquivos P2P</p></body>");
        response.write("</html>");
        response.end();
    }
).listen(8080);
