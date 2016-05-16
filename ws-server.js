var WebSocketServer = new require('ws'),
    WebSocketClient = require('websocket').client,
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
    request({
        uri: 'http://localhost:4000/getPort:ws',
        method: 'GET'
    }, function (error, message, port) {
        serverPort = port = parseInt(port, 10);

        initServer(port);

        initServerInstancesCommunications();
    });
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
        }

        connection.on('message', function (message) {
            log('(' + processId + ') Got message ');
            console.dir(message);
            sendOutWS_withoutCluster(message);
        });
    });

    wsClient.connect('ws://localhost:4010/?processId=' + processId, 'echo-protocol');
}

function log(msg) {
    console.log('\n\nws-server.js on port ' + serverPort + ' : ' + msg);
}
