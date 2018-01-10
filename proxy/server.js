'use strict';

const net = require('net');
const { Socket } = net;

const socket = new Socket({
    readable: true,
    writable: true
});
socket.connect({
    port: 8082
}, function () {
    console.log(arguments);
});

socket.on('error', function (error) {
    console.log('some error happens to the server socket', error);
});

let buffer = new Buffer(0);

socket.on('data', data => {
    buffer = buffer_add(buffer, data);
    if (buffer_find_body(buffer) == -1) return;
    console.log('data come', buffer.toString());
    let request = parse_request(buffer);
    if (request === false) return;
    //此处未能处理多个请求和续接的问题
    socket.removeAllListeners('data');
    relay_connection(request);

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
        //建立到目标服务器的连接
        let server = net.createConnection(req.port, req.host);
        //交换服务器与浏览器的数据
         socket.on("data", function(data){ server.write(data); });
         server.on("data", function(data){ socket.write(data); });
         if (req.method == 'CONNECT')
            socket.write(new Buffer('HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n'));
         else
            server.write(buffer);
    }
});



/**
* 从请求头部取得请求详细信息
* 如果是 CONNECT 方法，那么会返回 { method,host,port,httpVersion}
* 如果是 GET/POST 方法，那么返回 { metod,host,port,path,httpVersion}
*/
function parse_request (buffer) {
    let s = buffer.toString('utf8');
    
    let method = s.split('\n')[0].match(/^([A-Z]+)\s/);

    if (!method  || method.length <= 1) return false;

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