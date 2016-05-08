var express = require('express'),
    bodyParser = require('body-parser'),
    ws = new require('ws'),
    url = require('url'),
    webSocketServer,
    subscribers = {},
    app = express(),
    maxId = 0,
    cometNum = 0,
    wsNum = 0;

app.use(bodyParser.json());

app.get('/getId', function (req, res) {
    res.send('' + maxId);
    maxId++;
});

app.get('/getPort:type', function (req, res) {

    switch (req.params.type) {
        case 'comet':
            cometNum++;
            res.send('809' + cometNum);
            break;
        case 'ws':
            wsNum++;
            res.send('808' + wsNum);
            break;
        default:
            break;
    }
});

app.listen(4000, function () {
    console.log('Server helper util listening on port 4000!');
});


//============================= WebSocket helper for client servers =============================

webSocketServer = new ws.Server({
    port: 4010
});

webSocketServer.on('connection', function (ws) {
    var id = urlToProcessId(ws.upgradeReq.url);//saving id in js closure

    subscribers[id] = ws;

    ws.on('message', function (message) {
        var key;

        for (key in subscribers) {//here id is available
            if (subscribers.hasOwnProperty(key) && key !== id) {
                subscribers[key].send(message);
            }
        }
    });

    ws.on('close', function () {
        delete subscribers[id];
    });
});

function urlToProcessId(url) {
    return url.substring(url.indexOf('processId=') + 10);
}