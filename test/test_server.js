'use strict';

const { Socket } = require('net');

const socket = new Socket({
    readable: true,
    writable: true
});
socket.connect({
    port: 8082
});

socket.on('data', data => {
    console.log(data.toString('utf8'))
});