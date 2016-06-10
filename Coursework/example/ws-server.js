var WebSocketServer = new require('ws'),
    WebSocketClient = require('websocket').client,
    log4js = require('log4js'),
    log4jsConfig = require('./config/config.js').log4js,
    loggererror,
    loggerlog,
    wsClient = new WebSocketClient(),
    processId = process.pid,
    request = require('request'),
    emitToCluster,
    _ = require('lodash'),
    serverPort,
    clients = {},
    wsMapIds = {};

init();

function init() {
    log4js.configure(log4jsConfig);
    loggererror = log4js.getLogger('error');
    loggerlog = log4js.getLogger('info');

    request({
        uri: 'http://localhost:4000/getPort:ws',
        method: 'GET'
    }, function (error, message, port) {
        serverPort = port = parseInt(port, 10);

        initServer(port);

        initLogInterval(10000);
        initServerInstancesCommunications();
    });
}

function initLogInterval(time) {
    time = parseInt(time, 10) || 10000;

    log('Log interval has been started!');
    setInterval(function () {
        var messages = ['ws-server.js on port ',
            serverPort,
            ' Connections ',
            Object.keys(clients).length,
            ' Memory usage: ',
            JSON.stringify(process.memoryUsage())].join('');

        loggerlog.info(messages);
        log('Logged info message: ' + messages);
    }, time);
}

function initServer(port) {
    var webSocketServer = new WebSocketServer.Server({
        port: port
    });

    webSocketServer.on('connection', function (ws) {
        var id = _.uniqueId('ws_');
        clients[id] = ws;
        log("новое WS соединение " + id);

        ws.on('message', function (message) {
            var mapId;
            log('получено WS сообщение ' + message);
            message = JSON.parse(message);
            if (message.type === 'ping' && typeof message.id === 'undefined') {
                mapId = _.uniqueId('');
                wsMapIds[id] = mapId;
                clients[id].send(JSON.stringify({
                    type: 'newClient',
                    clientId: mapId
                }));
            } else {
                wsMapIds[id] = message.id;
                log("WS!");
                sendOutWS(message);
            }

        });

        ws.on('close', function () {
            log('соединение WS закрыто ' + id);
            delete clients[id];
            sendOutWS({
                type: 'removeClient',
                removeClientId: wsMapIds[id]
            });
        });

    });

}


function sendOutWS(message) {
    var key;
    emitToCluster(message);
    message = JSON.stringify(message);
    for (key in clients) {
        if (clients.hasOwnProperty(key)) {
            clients[key].send(message);
        }
    }
}


function sendOutWS_withoutCluster(message) {
    var key;
    message = JSON.stringify(message);
    for (key in clients) {
        if (clients.hasOwnProperty(key)) {
            clients[key].send(message);
        }
    }
}

function initServerInstancesCommunications() {
    wsClient.on('connectFailed', function (error) {
        log('Connect Error: ' + error.toString());
    });

    wsClient.on('connect', function (connection) {
        log('WebSocket Client Sender Connected');

        emitToCluster = function (data) {
            if (connection.connected) {
                connection.send(JSON.stringify(data));
            }
        };

        connection.on('message', function (message) {
            log('(' + processId + ') Got message ');
            console.dir(message);
            sendOutWS_withoutCluster(message);
        });
    });

    wsClient.connect('ws://localhost:4010/?processId=' + processId, 
							'echo-protocol');
}

function log(msg) {
    console.log('\n\nws-server.js on port ' + serverPort + ' : ' + msg);
}

process.on('uncaughtException', function (err) {
    var messages = ['comet-server.js on port ' + serverPort,
        'uncaughtException: ',
        err.message, '\r\n',
        err.stack].join('');

    loggererror.info(messages);

    console.error('uncaughtException: ', err.message);
    console.error(err.stack);
});