var http = require('http'),
    url = require('url'),
    _ = require('lodash'),
    subscribers = {},
    xhrMapIds = {};

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
    message = JSON.stringify(message);
    for (id in subscribers) {
        if (subscribers.hasOwnProperty(id)) {
            res = subscribers[id];
            res.end(message);
        }
    }
}

// -----------------------------------

if (!module.parent) {
    http.createServer(accept).listen(8082);
    console.log('XHR Сервер запущен на порту 8082');
} else {
    exports.accept = accept;
}