// Load the TCP Library
net = require('net');

// Keep track of the chat clients
var clients = [];

// Start a TCP Server
net.createServer(function (socket) {

  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 

  // Put this new client in the list
  clients.push(socket);

  // Send a nice welcome message and announce
  socket.write("Welcome " + socket.name + "\n");
  broadcast(socket.name + " joined the chat\n", socket);

  // Handle incoming messages from clients.
  socket.on('data', function (data) {
    broadcast(socket.name + "> " + data, socket);
  });

  // Remove the client from the list when it leaves
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    broadcast(socket.name + " left the chat.\n");
  });
  
  // Send a message to all clients
  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't want to send it to sender
      if (client === sender) return;
      client.write(message);
    });
    // Log it to the server output too
    process.stdout.write(message)
  }

}).listen(5000);

// Put a friendly message on the terminal of the server.
console.log("Chat server running at port 5000\n");

//Agora, tentando fazer um p2p

//identificando o iplocal...
var os = require('os');
var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
            addresses.push(address.address);
        }
    }
}

var meuIP = addresses[0];
if (typeof meuIP === 'undefined') {
    console.log ('No network found!');
    process.exit(0);
}
console.log('Network ok. MyIP:' + meuIP);


//Assumindo que já identificamos os pontos em um vetor... isso será feito no broadcast
var pontos = ['172.20.10.4', '172.20.10.10', '172.20.10.11'];

while (true) {

        console.log('teste');
        pontos.forEach(function (ponto) {
            if (ponto===meuIP) return;

            var oclient = new net.Socket();
            oclient.connect(5000, ponto, function() {
                console.log('Connected');
                oclient.write('Hello, server! Love, Client.' + meuIP);
            });
            
            oclient.on('data', function(data) {
                console.log('Como cliente, Recebi: ' + data);
                
            });
            
            oclient.on('close', function() {
                console.log('Connection closed');
            });
/*
            oclient.on('error', function(err) {
                if (err.code === 'ECONNREFUSED') {
                console.log('Servidor remoto ainda não está no ar. Esperará 10 secs e tentará de novo...');
                //var waitTill = new Date(new Date().getTime() + seconds * 1000);
                //while(waitTill > new Date()){}
                }
            }
            );
*/
        });
}