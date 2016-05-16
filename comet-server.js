var http = require('http'),
    request = require('request'),
    log4js = require('log4js'),
    log4jsConfig = require('./config/config.js').log4js,
    loggererror,
    WebSocketClient = require('websocket').client,
    wsClient = new WebSocketClient(),
    emitToCluster,
    processId = process.pid,
    url = require('url'),
    _ = require('lodash'),
    serverPort,
    subscribers = {},
    xhrMapIds = {};


// -----------------------------------
init();

function init() {
    log4js.configure(log4jsConfig);
    loggererror = log4js.getLogger('error');

    request({
        uri: 'http://localhost:4000/getPort:comet',
        method: 'GET'
    }, function (error, message, port) {
        serverPort = port = parseInt(port, 10);

        http.createServer(accept).listen(port);
        initServerInstancesCommunications();
        log('XHR Сервер запущен на порту ' + port);
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

    log("новый XHR клиент " + id + ", клиентов:" + Object.keys(subscribers).length);

    req.on('close', function () {
        delete subscribers[id];
        log("XHR клиент " + id + " отсоединился, клиентов:" + Object.keys(subscribers).length);

        sendOutCOMET({
            type: 'removeClient',
            removeClientId: xhrMapIds[id]
        });
    });

}

function publish(message) {
    log(JSON.stringify(message));
    log("есть сообщение, клиентов:" + Object.keys(subscribers).length);

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

    log('XHR: ' + req.data);
    log('XHR urlParsed.pathname ' + urlParsed.pathname);

    // отправка сообщения
    if (urlParsed.pathname == '/publish' && req.method == 'POST') {
        // принять POST-запрос
        req.setEncoding('utf8');

        req.on('data', function (message) {
            log("XHR!");
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

function sendOutCOMET_withoutCluster(message) {
    var id,
        res;
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
            sendOutCOMET_withoutCluster(message);
        });
    });

    wsClient.connect('ws://localhost:4010/?processId=' + processId, 'echo-protocol');
}

function log(msg) {
    console.log('\n\ncomet-server.js on port ' + serverPort + ' : ' + msg);
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