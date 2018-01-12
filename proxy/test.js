const net = require('net');
const proxy = {
    port: 20057,
    host: '127.0.0.1'
};

net.createServer(function (clientSocket) {
    
    clientSocket.once('data', function (firstChunk) {

        // console.log(firstChunk.toString('utf8'));

        // 解析http协议头, 分析出请求的url
        var url = /[A-Z]+\s+([^\s]+)\s+HTTP/.exec(firstChunk)[1];
        if (url.indexOf('//') === -1) {
            // https协议交给pac脚本会得到错误的端口.
            url = 'http://' + url;
        }        

        var serverSocket = net.connect(proxy.port, proxy.host, function () {
            clientSocket.pipe(serverSocket);
            serverSocket.write(firstChunk);
            serverSocket.pipe(clientSocket);
            serverSocket.on('end', function() {
                clientSocket.end();
            });
        });

    });
}).listen(8088);

process.on('uncaughtException', function (error) {
    console.log('error', error);
});