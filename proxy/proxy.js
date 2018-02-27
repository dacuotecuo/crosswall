/**
 * 用户服务器之间交互的proxy服务
 * 需要监听两个端口
 * 1.监听来自用户侧的请求内容
 * 2.建立socket连接，与内网环境进行交互
 */
'use strict'
const net = require('net');

let client_socket = null;
let proxy_socket = null;

const client = net.createServer(socket => {

    client_socket = socket;

    console.log(socket.remoteAddress);
    socket.once('data', data => {
        console.log('data', data);
    })
});


const proxy = net.createServer(socket => {
    proxy_socket = socket;
    console.log('come proxy connect');
    let buffer = new Buffer(0);
    socket.once('data', data => {

        console.log('proxy socket receive data', data.toString('utf8'));
        buffer = buffer_add(buffer, data);
        if (buffer_find_body(buffer) == -1) return;

        let req = parse_request(buffer);
        if (req === false) return;
        socket.removeAllListeners('data');
        relay_connection(req);
    });

    socket.on('close', function (err) {
        console.log('client closed with proxy, port: 8081', err);
    });

    function relay_connection(req) {
        console.log(req.method + ' ' + req.host + ':' + req.port);
        //如果请求不是CONNECT方法（GET, POST），那么替换掉头部的一些东西
        if (req.method != 'CONNECT') {
            //先从buffer中取出头部
            let _body_pos = buffer_find_body(buffer);
            if (_body_pos < 0) _body_pos = buffer.length;
            let header = buffer.slice(0,_body_pos).toString('utf8');
            //替换connection头
            header = header.replace(/(proxy-)?connection:.+\r\n/ig, '')
                    .replace(/Keep-Alive:.+\r\n/i, '')
                    .replace("\r\n", '\r\nConnection: close\r\n');
            //替换网址格式(去掉域名部分)
            if (req.httpVersion == '1.1') {
                let url = req.path.replace(/http:\/\/[^\/]+/, '');
                if (url.path != url) header = header.replace(req.path,url);
            }
            buffer = buffer_add(new Buffer(header,'utf8'),buffer.slice(_body_pos));
        }

        //交换服务器与浏览器的数据
         socket.on("data", function(data){ client_socket.write(data); });
         client_socket.on("data", function(data){ socket.write(data); });
         if (req.method == 'CONNECT')
            socket.write(new Buffer('HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n'));
         else
            client_socket.write(buffer);
    }

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
process.on('uncaughtException', err => {
    console.log('uncaughtException=', err);
});



/*
* 从缓存中找到头部结束标记(“\r\n\r\n”)的位置
*/
function buffer_find_body (b) {
    for (let i=0,len=b.length-3;i < len;i++) {
        if (b[i] == 0x0d && b[i+1] == 0x0a && b[i+2] == 0x0d && b[i+3] == 0x0a) {
            return i+4;
        }
    }
    return -1;
 }


/**
 * 从请求头部取得请求详细信息
 * 如果是 CONNECT 方法，那么会返回 { method,host,port,httpVersion}
 * 如果是 GET/POST 方法，那么返回 { metod,host,port,path,httpVersion}
 */
function parse_request (buffer) {
    let s = buffer.toString('utf8');
    let method = s.split('\n')[0].match(/^([A-Z]+)\s/);

    if (!method || method.length < 2) return false;
    method = method[1];
    if (method == 'CONNECT') {
        let arr = s.match(/^([A-Z]+)\s([^:\s]+):(\d+)\sHTTP\/(\d.\d)/);
        if (arr && arr[1] && arr[2] && arr[3] && arr[4])
            return { method: arr[1], host:arr[2], port:arr[3],httpVersion:arr[4] };
    } else {
        let arr = s.match(/^([A-Z]+)\s([^\s]+)\sHTTP\/(\d.\d)/);
        if (arr && arr[1] && arr[2] && arr[3]) {
            let host = s.match(/Host:\s+([^\n\s\r]+)/)[1];
            if (host) {
                let _p = host.split(':',2);
                return { method: arr[1], host:_p[0], port:_p[1]?_p[1]:80, path: arr[2],httpVersion:arr[3] };
            }
        }
    }
    return false;
 }

 /**
 * [buffer_add description]
 * @param  {[type]} buf1 [description]
 * @param  {[type]} buf2 [description]
 * @return {[type]}      [description]
 */
function buffer_add (buf1, buf2) {
    let re = new Buffer(buf1.length + buf2.length);
    buf1.copy(re);
    buf2.copy(re, buf1.length);
    return re;
 }