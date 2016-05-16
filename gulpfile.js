'use strict';
var gulp = require('gulp'),
    exec = require('child_process').exec,
    fork = require('child_process').fork,
    maxBufferSize = 1024 * 50000,
    stopNginx = false;

//require('require-dir')('./gulp');

gulp.task('serve', function () {
    var serverHelper;
    stopNginx = true;

    exec('start restart-nginx.bat',       callback);
    serverHelper = fork('server-helper-util.js', {maxBuffer: maxBufferSize}, callback);

    serverHelper.on('message', function (msg) {
        if (msg === 'done') {
            fork('static-server.js', {maxBuffer: maxBufferSize}, callback);
            fork('ws-server.js',     {maxBuffer: maxBufferSize}, callback);
            fork('ws-server.js',     {maxBuffer: maxBufferSize}, callback);
            fork('comet-server.js',  {maxBuffer: maxBufferSize}, callback);
            fork('comet-server.js',  {maxBuffer: maxBufferSize}, callback);
        }
    });

});

gulp.task('test-comet', function () {
    var numberOfSubscribers = process.argv.slice(4)[0] || 1,
        testHelper,
        i;

    console.log('Start of ' + numberOfSubscribers + ' test instances...');

    testHelper = fork('test-helper-util.js');

    testHelper.on('message', function (msg) {
        if (msg === 'done') {
            fork('test-comet-send.js');

            for (i = 0; i < numberOfSubscribers; i++) {
                fork('test-comet.js');
            }
            //exec('pm2 start test-comet.js -i' + numberOfSubscribers + ' --no-autorestart', callback.bind({msg: 'Started!'}));
        }
    });

});

gulp.task('test-ws', function () {
    var numberOfSubscribers = process.argv.slice(4)[0] || 1,
        testHelper,
        i;

    console.log('Start of ' + numberOfSubscribers + ' test instances...');

    testHelper = fork('test-helper-util.js');

    testHelper.on('message', function (msg) {
        if (msg === 'done') {
            fork('test-ws-send.js');

            for (i = 0; i < numberOfSubscribers; i++) {
                fork('test-ws.js');
            }
            //exec('pm2 start test-ws.js -i' + numberOfSubscribers + ' --no-autorestart', callback.bind({msg: 'Started!'}));
        }
    });

});

function callback(error, stdout, stderr) {
    if (error) {
        console.log('Error!');
        console.dir(error);
    } else {
        if (this && this.msg) {
            console.log(this.msg);
        }
    }
}

process.on('SIGINT', function () {
    console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
    if (stopNginx) {
        exec('start stop-nginx.bat', function () {
            console.log('Done!');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});
