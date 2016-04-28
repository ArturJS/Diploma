var request = require('request'),
    myId = 123,
    iteration = 0,
    sendIntervalId,
    sendMessage;

sendMessage = send.bind({}, 'http://localhost:8082/publish', 'POST', {
    id: myId,
    data: 'Message for comet!'
});

sendIntervalId = setInterval(sendMessage, 0);

function send(uri, method, data, callback) {
    callback = callback || function () {};

    request({
        uri: uri,
        method: method,
        json: data
    }, callback);
}