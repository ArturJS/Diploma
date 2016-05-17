var gulp = require('gulp'),
    exec = require('child_process').exec,
    fork = require('child_process').fork,
    maxBufferSize = 1024 * 50000,
    stopNginx = false;

//require('require-dir')('./gulp');

gulp.task('serve', function () {
    var serverHelper;
    stopNginx = true;

    exec('start restart-nginx.bat', callback);
    serverHelper = fork('server-helper-util.js', {maxBuffer: maxBufferSize}, callback);

    serverHelper.on('message', function (msg) {
        if (msg === 'done') {
            fork('static-server.js', {maxBuffer: maxBufferSize}, callback);
            fork('ws-server.js', {maxBuffer: maxBufferSize}, callback);
            fork('ws-server.js', {maxBuffer: maxBufferSize}, callback);
            fork('comet-server.js', {maxBuffer: maxBufferSize}, callback);
            fork('comet-server.js', {maxBuffer: maxBufferSize}, callback);
        }
    });

});

gulp.task('test-comet', function () {
    var numberOfSubscribers = parseInt(process.argv.slice(4)[0], 10) || 1,
        testHelper;

    console.log('Start of ' + numberOfSubscribers + ' test instances...');

    testHelper = fork('test-helper-util.js');

    testHelper.on('message', function (msg) {
        if (msg === 'done') {
            initSubscribers();
        }
    });

    function initSubscribers() {//TODO create generic solution
        var activeSubscribers = 0,
            i;

        for (i = 0; i < numberOfSubscribers; i++) {
            console.log('Starting ' + i + ' test-comet.js');

            fork('test-comet.js').on('message', function (message) {
                if (message === 'done') {
                    activeSubscribers++;
                    console.log('Active subscribers: ' + activeSubscribers);

                    if (activeSubscribers === numberOfSubscribers) {
                        console.log('Starting test-comet-send.js');
                        fork('test-comet-send.js');
                    }
                }
            });
        }
    }

});

gulp.task('test-ws', function () {
    var numberOfSubscribers = parseInt(process.argv.slice(4)[0], 10) || 1,
        testHelper,
        i;

    console.log('Start of ' + numberOfSubscribers + ' test instances...');

    testHelper = fork('test-helper-util.js');

    testHelper.on('message', function (msg) {
        if (msg === 'done') {
            initSubscribers();
        }
    });

    function initSubscribers() {//TODO create generic solution
        var activeSubscribers = 0,
            i;

        for (i = 0; i < numberOfSubscribers; i++) {
            console.log('Starting ' + i + ' test-ws.js');

            fork('test-ws.js').on('message', function (message) {
                if (message === 'done') {
                    activeSubscribers++;
                    console.log('Active subscribers: ' + activeSubscribers);

                    if (activeSubscribers === numberOfSubscribers) {
                        console.log('Starting test-ws-send.js');
                        fork('test-ws-send.js');
                    }
                }
            });
        }
    }

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
