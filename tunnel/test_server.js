const net = require('net');
const Socket = net.Socket;
const vpn = { port: 20057, host: '127.0.0.1' };

const client = new Socket({
    // allowHalfOpen: true,
    readable: true,
    writable: true
});

client.once('data', buff => {

    let url_obj = /[A-Z]+\s+([^\s]+)\s+HTTP/.exec(buff);
    if (!url_obj || !url_obj.length) { 
        console.log(buff.toString());
        return; 
    }

    let url = url_obj[1];

    if (url.indexOf('//') === -1) {

        url = 'http://' + url;
    }

    const vpn_socket = net.connect(vpn.port, vpn.host, function() {
        client.pipe(vpn_socket);
        vpn_socket.write(buff);
        vpn_socket.pipe(client);
        vpn_socket.on('end', function() {
            client.end();
        });
    });


});

client.connect(9999, function () {
    console.log('connect suc', arguments);
});

// client.write(new Buffer('data'));