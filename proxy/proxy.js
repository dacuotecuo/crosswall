/**
 * 用户服务器之间交互的proxy服务
 * 需要监听两个端口
 * 1.监听来自用户侧的请求内容
 * 2.建立socket连接，与内网环境进行交互
 */
'use strict'
const net = require('net');

let client_socket = null;

const proxy = net.createServer(socket => {
    console.log('come proxy connect');
    socket.on('data', data => {
        console.log('receive data', data.toString('utf8'));
        client_socket.write(data);
    });
    socket.on('close', function (err) {
        console.log('client closed with proxy, port: 8081', err);
    });
});

const client = net.createServer(socket => {
    client_socket = socket;

    socket.on('close', function () {
        console.log('client closed with client server, port: 8082');
    });
});


proxy.listen(8081, () => {
    console.log('proxy server listening 8081 ');
});
client.listen(8082, () => {
    console.log('client server listening 8082');
});

proxy.on('error', function (err) {
    console.log('proxy server error happens', err);
});

client.on('error', function (err) {
    console.log('client server error happens', err);
});

//处理各种错误
process.on('uncaughtException', function (err) {
    console.log('\nError!!!', arguments);
    console.log(err);
 });