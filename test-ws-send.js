var WebSocketClient = require('websocket').client,
    client = new WebSocketClient();

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Sender Connected');

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

    sendData();
});

client.connect('ws://localhost:8081/', 'echo-protocol');