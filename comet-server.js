var http = require('http'),
    request = require('request'),
    WebSocketClient = require('websocket').client,
    wsClient = new WebSocketClient(),
    emitToCluster,
    processId = process.pid,
    url = require('url'),
    _ = require('lodash'),
    subscribers = {},
    xhrMapIds = {};


// -----------------------------------
init();

function init() {
    request({
        uri: 'http://localhost:4000/getPort:comet',
        method: 'GET'
    }, function (error, message, port) {
        port = parseInt(port, 10);

        http.createServer(accept).listen(port);
        initServerInstancesCommunications();
        console.log('XHR Сервер запущен на порту ' + port);
    });
}


function onSubscribe(req, res, query) {
    var id,
        mapId;

    res.setHeader('Content-Type', 'text/plain;charset=utf-8');
    res.setHeader("Cache-Control", "no-cache, must-revalidate");

    id = _.uniqueId('xhr_');

    if (typeof query.clientId !== 'undefined') {
        id = query.clientId;
        subscribers[id] = res;
        xhrMapIds[id] = query.clientId;
    } else {
        mapId = _.uniqueId('');
        xhrMapIds[id] = mapId;
        subscribers[id] = res;
        subscribers[id].end(JSON.stringify({
            type: 'newClient',
            clientId: mapId
        }));
    }

    console.log("новый XHR клиент " + id + ", клиентов:" + Object.keys(subscribers).length);

    req.on('close', function () {
        delete subscribers[id];
        console.log("XHR клиент " + id + " отсоединился, клиентов:" + Object.keys(subscribers).length);

        sendOutCOMET({
            type: 'removeClient',
            removeClientId: xhrMapIds[id]
        });
    });

}

function publish(message) {
    console.log(JSON.stringify(message));
    console.log("есть сообщение, клиентов:" + Object.keys(subscribers).length);

    sendOutCOMET(message);

    //subscribers = {};
}

function accept(req, res) {
    var urlParsed = url.parse(req.url, true),
        query = urlParsed.query;

    // новый клиент хочет получать сообщения
    if (urlParsed.pathname == '/subscribe') {
        onSubscribe(req, res, query); // собственно, подписка
        return;
    }

    console.log('XHR: ' + req.data);
    console.log('XHR urlParsed.pathname ' + urlParsed.pathname);

    // отправка сообщения
    if (urlParsed.pathname == '/publish' && req.method == 'POST') {
        // принять POST-запрос
        req.setEncoding('utf8');

        req.on('data', function (message) {
            console.log("XHR!");
            publish(JSON.parse(message)); // собственно, отправка
            res.end("ok");
        });
    }
}

function sendOutCOMET(message) {
    var id,
        res;
    emitToCluster(message);
    message = JSON.stringify(message);
    for (id in subscribers) {
        if (subscribers.hasOwnProperty(id)) {
            res = subscribers[id];
            res.end(message);
        }
    }
}


function initServerInstancesCommunications() {
    wsClient.on('connectFailed', function (error) {
        console.log('Connect Error: ' + error.toString());
    });

    wsClient.on('connect', function (connection) {
        console.log('WebSocket Client Sender Connected');

        emitToCluster = function (data) {
            if (connection.connected) {
                connection.send(JSON.stringify(data));
            }
        }
    });

    wsClient.connect('ws://localhost:4010/?processId=' + processId, 'echo-protocol');
}

