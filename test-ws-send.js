var WebSocketClient = require('websocket').client,
    client = new WebSocketClient(),
    sendIntervalId;

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Sender Connected');

    sendIntervalId = setInterval(sendData, 0);

    function sendData() {
        var data;
        if (connection.connected) {
            data = "Message for ws!";
            connection.send(JSON.stringify({
                id: 12345,
                data: data
            }));
        }
    }
});

client.connect('ws://localhost:10000/ws/', 'echo-protocol');