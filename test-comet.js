var request = require('request'),
    _ = require('lodash'),
    myId,
    fs = require('fs'),
    iteration = 0,
    responseTimeList = [],
    lastTime,
    sendMessage,
    sendStatistic,
    getId;

initSendFunctions();

getId();


function initSendFunctions() {
    sendMessage = send.bind({}, 'http://localhost:10000/publish', 'POST', {
        id: myId,
        data: 'Message for comet!'
    });

    sendStatistic = send.bind({}, 'http://localhost:3000/sendStatistic', 'POST', {
        data: responseTimeList
    }, function () {
        log('Statistic has been sent!');
    });

    getId = send.bind({}, 'http://localhost:3000/getId', 'GET', {}, function (error, response, body) {
        myId = body;
        log(body);
        subscribe();
    });
}


function subscribe() {
    lastTime = new Date();

    request
        .get('http://localhost:10000/xhr/subscribe/?clientId=' + myId)
        .on('response', function (response) {
            var timeDiff = (new Date()) - lastTime;

            responseTimeList[iteration] = ['comet',
                myId,
                timeDiff,
                lastTime.toLocaleTimeString(),
                lastTime.getMilliseconds()].join(' ');
            iteration++;

            log('\n\n statusCode = ' + response.statusCode + '\n');
            log(response.headers['content-type']);

            if (iteration > 100) {
                iteration = 0;
                log('Send statistic!');
                sendStatistic();
            }

            subscribe();

        });
}

function send(uri, method, data, callback) {
    callback = callback || function () {
        };

    request({
        uri: uri,
        method: method,
        json: data
    }, callback);
}


function log(msg) {
    console.log('\n\n (' + myId + ') test-comet.js : ' + msg);
}
