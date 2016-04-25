var WebSocketClient = require('websocket').client,
    _ = require('lodash'),
    fs = require('fs'),
    client = new WebSocketClient(),
    iteration = 0,
    responseTimeList = [],
    lastTime;

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });

    connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
    });

    connection.on('message', function (message) {
        responseTimeList[iteration] = (new Date()) - lastTime;
        iteration++;

        console.log("Received: '" + message.utf8Data.toString() + "'");

        if (iteration > 100) {
            saveStatistic();
            process.exit(0);
        }

        sendData();
    });

    function sendData() {
        var data;
        if (connection.connected) {
            lastTime = new Date();
            data = "Message for ws!";
            connection.send(JSON.stringify({
                id: 123,
                data: data
            }));
            //setTimeout(sendNumber, 1000);
        }
    }

    sendData();
});

client.connect('ws://localhost:8081/', 'echo-protocol');

function saveStatistic() {
    var maxResponceTime = _.max(responseTimeList),
        copyResponseTimeList = responseTimeList.slice(),
        medianTime = findMedian(copyResponseTimeList);

    fs.writeFileSync('ws-statistic.txt', pushArray([
        'Max responce time = ' + maxResponceTime,
        'Median time = ' + medianTime
    ], responseTimeList).join('\r\n'));
}

function showAllData(obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            console.log(i + " = " + obj[i]);
        }
    }
    console.log(" ");
}

function findMedian(data) {
    var m = data.sort(function(a, b) {
        return a - b;
    });

    var middle = Math.floor((m.length - 1) / 2);
    if (m.length % 2) {
        return m[middle];
    } else {
        return (m[middle] + m[middle + 1]) / 2.0;
    }
}

function pushArray(arr, arr2) {
    Array.prototype.push.apply(arr, arr2);
    return arr;
}