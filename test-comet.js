var request = require('request'),
    _ = require('lodash'),
    myId = 123,
    fs = require('fs'),
    iteration = 0,
    responseTimeList = [],
    lastTime,
    sendIntervalId,
    sendMessage,
    sendStatistic;

sendMessage = send.bind({}, 'http://localhost:8082/publish', 'POST', {
    id: myId,
    data: 'Message for comet!'
});

sendStatistic = send.bind({}, 'http://localhost:3000/sendStatistic', 'POST', {
    id: myId,
    data: responseTimeList
});

getId = send.bind({}, 'http://localhost:3000/getId', 'GET', {}, function (error, response, body) {
    myId = body;
    console.log(body);
    subscribe();
});

getId();

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
                console.log('Save statistic!');
                sendStatistic();
                //saveStatistic();
                //process.exit(0);
                clearInterval(sendIntervalId);
                return;
            }
            //clearInterval(sendIntervalId);
            console.log('');
            subscribe();

        });
}

/*function sendMessage() {

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
 }*/

//sendIntervalId = setInterval(sendMessage, 0);


function send(uri, method, data, callback) {
    callback = callback || function () {};

    request({
        uri: uri,
        method: method,
        json: data
    }, callback);
}

function saveStatistic() {
    var maxResponceTime = _.max(responseTimeList),
        copyResponseTimeList = responseTimeList.slice(),
        medianTime = findMedian(copyResponseTimeList),
        fileName = 'comet-statistic-',
        fullFileName,
        fileNumber = 0;

    do {
        fileNumber++;
        fullFileName = [fileName, fileNumber, '.txt'].join('');
    } while (fileExists(fullFileName));

    fs.writeFileSync(fullFileName, pushArray([
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

function fileExists(fileName) {
    try {
        fs.statSync(fileName).isFile();
    } catch (e) {
        return false;
    }

    return true;
}