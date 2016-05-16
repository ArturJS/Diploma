var WebSocketClient = require('websocket').client,
    request = require('request'),
    _ = require('lodash'),
    fs = require('fs'),
    client = new WebSocketClient(),
    iteration = 0,
    responseTimeList = [],
    lastTime = new Date(),
    sendStatistic,
    myId,
    getId;

initSendFunctions();

getId();

client.on('connectFailed', function (error) {
    log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    log('WebSocket Client Connected');
    connection.on('error', function (error) {
        log("Connection Error: " + error.toString());
    });

    connection.on('close', function () {
        log('echo-protocol Connection Closed');
    });

    connection.on('message', function (message) {
        var timeDiff = (new Date()) - lastTime;

        responseTimeList[iteration] = ['ws',
            myId,
            timeDiff,
            lastTime.toLocaleTimeString(),
            lastTime.getMilliseconds()].join(' ');
        iteration++;
        lastTime = new Date();

        log("Received: '" + message.utf8Data.toString() + "'");

        if (iteration > 100) {
            iteration = 0;
            log('Send statistic!');
            sendStatistic();
        }
    });

});

log('Try to connect ws://localhost:10000/ws/...');
client.connect('ws://localhost:10000/ws/', 'echo-protocol');

function initSendFunctions() {
    sendStatistic = send.bind({}, 'http://localhost:3000/sendStatistic', 'POST', {
        data: responseTimeList
    }, function () {
        log('Statistic has been sent!');
    });

    getId = send.bind({}, 'http://localhost:3000/getId', 'GET', {}, function (error, response, body) {
        myId = body;
        log(body);
    });
}

function send(uri, method, data, callback) {
    callback = callback || function () {
        };

    request({
        uri: uri,
        method: method,
        json: data
    }, callback);
}


function log(msg) {
    console.log('\n\n (' + myId + ') test-ws.js : ' + msg);
}
