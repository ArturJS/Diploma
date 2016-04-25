var request = require('request'),
    _ = require('lodash'),
    myId = 123,
    fs = require('fs'),
    iteration = 0,
    responseTimeList = [],
    lastTime,
    sendIntervalId;

function subscribe() {
    lastTime = new Date();
    
    request
        .get('http://localhost:8082/subscribe?clientId=' + myId)
        .on('response', function (response) {
            responseTimeList[iteration] = (new Date()) - lastTime;
            iteration++;

            console.log(response.statusCode);
            console.log(response.headers['content-type']);

            if (iteration > 100) {
                saveStatistic();
                process.exit(0);
            }
            //clearInterval(sendIntervalId);
            //send();
            subscribe();
        });
}

function send() {

    request({
        uri: 'http://localhost:8082/publish',
        method: 'POST',
        json: {
            "id": myId,
            "data": 'Message for comet!'
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Send done! Body = " + body);
        }
    });
}

sendIntervalId = setInterval(send, 0);

subscribe();


function saveStatistic() {
    var maxResponceTime = _.max(responseTimeList),
        copyResponseTimeList = responseTimeList.slice(),
        medianTime = findMedian(copyResponseTimeList);

    fs.writeFileSync('comet-statistic.txt', pushArray([
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
    var m = data.sort(function (a, b) {
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