const net = require('net');
const Socket = net.Socket;

const client = new Socket({
    allowHalfOpen: true,
    readable: true,
    writable: true
});

client.on('data', buff => {
    console.log(buff.toString());
});

client.connect(8888, function () {
    console.log('connect suc', arguments);
});

client.write(new Buffer('data'));