'use strict';

const { Socket } = require('net');
const request = require('request');

request({
    
})

const socket = new Socket({
    readable: true,
    writable: true
});
socket.connect({
    port: 8081
});

socket.write(new Buffer('asdasds \n'));