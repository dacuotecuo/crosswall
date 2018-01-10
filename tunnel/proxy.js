const net = require('net');

let client = null;
let server = null;
net.createServer(function (c) {

    c.on('data', function (buff) {
        server.write(buff);
    });

    client = c;

}).listen(6666);

net.createServer(function (s) {

    s.on('data', function (buff) {
        
        if (buff.toString('utf8') === 'end') client.end();
        else client.write(buff);
    });

    server = s;

}).listen(7777);
