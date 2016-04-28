var express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    maxId = 0;

app.use(bodyParser.json());

app.get('/getId', function (req, res) {
    res.send('' + maxId);
    maxId++;
});

app.post('/sendStatistic', function (req, res) {
    console.dir(req.body);
    console.log('Statistics has been sent!');
    res.send('Statistics has been sent!');
});

app.listen(3000, function () {
    console.log('Test balancer listening on port 3000!');
});