const net = require('net');
const socket = new net.Socket();

socket.connect({
    port: 7777
}, function () {
    console.log('socket connect suc');
});

socket.on('data', chunk => {

    var url = /[A-Z]+\s+([^\s]+)\s+HTTP/.exec(chunk)
    if (!url || url.length < 2) return;

    url = url[1];
    
    if (url.indexOf('//') === -1) {
        // https协议交给pac脚本会得到错误的端口.
        url = 'http://' + url;
    }
    // 这个异步调用是在使用pac脚本计算应该使用哪个代理.
    const proxy = getProxyHostAndPort(url);

    var serverSocket = net.connect(proxy.port, proxy.host, function() {
        socket.pipe(serverSocket);
        serverSocket.write(chunk);
        serverSocket.pipe(socket);
        serverSocket.on('end', function() {
            socket.write('end');
        });
    });
});

socket.on('error', function (error) {
    console.log('error', error)
});

/**
 * 
 * 
 * @returns 
 */
function getProxyHostAndPort () {
    return {
        host: '127.0.0.1',
        port: 20057
    }
}