var express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    app = express(),
    maxId = 0,
    fileName = 'statistic.txt';

app.use(bodyParser.json());

app.get('/getId', function (req, res) {
    res.send('' + maxId);
    maxId++;
});

app.post('/sendStatistic', function (req, res) {
    var doneMessage = 'Statistics has been sent!',
        data = req.body.data;

    console.dir(data);
    console.log(doneMessage);

    saveStatistic(data);

    res.send(doneMessage);
});

app.listen(3000, function () {
    console.log('Test balancer listening on port 3000!');
});

initFile();

function saveStatistic(data) {
    data = '\r\n' + data.join('\r\n');

    fs.appendFile(fileName, data, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

function initFile() {
    if (!fileExists(fileName)) {
        fs.writeFileSync(fileName, {});
    }
}

function fileExists(fileName) {
    try {
        fs.statSync(fileName).isFile();
    } catch (e) {
        return false;
    }

    return true;
}

