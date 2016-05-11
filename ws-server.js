var WebSocketServer = new require('ws'),
    processId = process.pid,
    request = require('request'),
    _ = require('lodash'),
    clients = {},
    wsMapIds = {};

init();

function init() {
    request({
        uri: 'http://localhost:4000/getPort:ws',
        method: 'GET'
    }, function (port) {
        port = parseInt(port, 10);

        initServer(port);
    });
}

function initServer(port) {
    var webSocketServer = new WebSocketServer.Server({
        port: port
    });

    webSocketServer.on('connection', function (ws) {
        var id = _.uniqueId('ws_');
        clients[id] = ws;
        console.log("новое WS соединение " + id);

        ws.on('message', function (message) {
            var mapId;
            console.log('получено WS сообщение ' + message);
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
                console.log("WS!");
                sendOutWS(message);
            }

        });

        ws.on('close', function () {
            console.log('соединение WS закрыто ' + id);
            delete clients[id];
            sendOutWS({
                type: 'removeClient',
                removeClientId: wsMapIds[id]
            });
        });

    });

    function sendOutWS(message) {
        var key;
        message = JSON.stringify(message);
        for (key in clients) {
            if (clients.hasOwnProperty(key)) {
                clients[key].send(message);
            }
        }
    }
}



