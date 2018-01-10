// 'use strict';

// const { Socket } = require('net');
// const request = require('request');

// request({
    
// })

// const socket = new Socket({
//     readable: true,
//     writable: true
// });
// socket.connect({
//     port: 8081
// });

// socket.write(new Buffer('asdasds \n'));

const net = require('net');

net.createServer(function (clientSocket) {
    
    clientSocket.once('data', function (firstChunk) {
        // 解析http协议头, 分析出请求的url
        var url = /[A-Z]+\s+([^\s]+)\s+HTTP/.exec(firstChunk)[1];
        if (url.indexOf('//') === -1) {
            // https协议交给pac脚本会得到错误的端口.
            url = 'http://' + url;
        }
        // 这个异步调用是在使用pac脚本计算应该使用哪个代理.
        const proxy = getProxyHostAndPort(url);

        var serverSocket = net.connect(proxy.port, proxy.host, function() {
            clientSocket.pipe(serverSocket);
            serverSocket.write(firstChunk);
            serverSocket.pipe(clientSocket);
            serverSocket.on('end', function() {
                clientSocket.end();
            });
        });

    });
}).listen(8088);


function getProxyHostAndPort () {
    return {
        host: '127.0.0.1',
        port: 20057
    }
}