'use strict';
var gulp = require('gulp'),
    exec = require('child_process').exec,
    stopNginx = false;

//require('require-dir')('./gulp');

gulp.task('serve', function () {
    stopNginx = true;
    exec('start restart-nginx.bat',       callback);
    //exec('node server-helper-util.js', {maxBuffer: 1024 * 50000}, callback.bind({msg: 'server-helper-util.js started!'}));
    exec('node static-server.js',      {maxBuffer: 1024 * 50000}, callback.bind({msg: 'static-server.js started!'}));
    //exec('node ws-server.js',          {maxBuffer: 1024 * 50000}, callback.bind({msg: 'ws-server.js started!'}));
    //exec('node ws-server.js',          {maxBuffer: 1024 * 50000}, callback.bind({msg: 'ws-server.js started!'}));
    //exec('node comet-server.js',       {maxBuffer: 1024 * 50000}, callback.bind({msg: 'comet-server.js started!'}));
    //exec('node comet-server.js',       {maxBuffer: 1024 * 50000}, callback.bind({msg: 'comet-server.js started!'}));
});

gulp.task('test-comet', function () {
    var numberOfSubscribers = process.argv.slice(4)[0] || 1,
        i;

    console.log('Start of ' + numberOfSubscribers + ' test instances...');

    exec('node test-helper-util.js', callback);
    exec('node test-comet-send.js', callback);

    for (i = 0; i < numberOfSubscribers; i++) {
        exec('node test-comet.js', callback);
    }
    //exec('pm2 start test-comet.js -i' + numberOfSubscribers + ' --no-autorestart', callback.bind({msg: 'Started!'}));
});

gulp.task('test-ws', function () {
    var numberOfSubscribers = process.argv.slice(4)[0] || 1,
        i;

    console.log('Start of ' + numberOfSubscribers + ' test instances...');

    exec('node test-helper-util.js', callback);
    exec('node test-ws-send.js', callback);
    exec('node test-ws.js', callback);
    for (i = 0; i < numberOfSubscribers; i++) {
        exec('node test-ws.js', callback);
    }
    //exec('pm2 start test-ws.js -i' + numberOfSubscribers + ' --no-autorestart', callback.bind({msg: 'Started!'}));
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
