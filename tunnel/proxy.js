
/**
 * 创建socket
 */

'use strict';
const net = require('net');

let client_socket = null;
let server_socket = null;
const client = net.createServer(c => {

    client_socket = c;
    server_socket && client_socket.pipe(server_socket);

}).listen(8888);


const server = net.createServer(s => {

    server_socket = s;

    client_socket && server_socket.pipe(client_socket);

}).listen(9999);

process.on('uncaughtException', function (error) {
    console.log(error)
});