var WebSocketServer = new require('ws'),
    _ = require('lodash'),
    clients = {},
    wsMapIds = {};

// WebSocket-сервер на порту 8081
var webSocketServer = new WebSocketServer.Server({
    port: 8081
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

