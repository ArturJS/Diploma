var gulp = require('gulp'),
    exec = require('child_process').exec,
    fork = require('child_process').fork,
    tcpPortUsed = require('tcp-port-used'),
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
        initCometSubscribers = initSubscribers.bind({}, numberOfSubscribers, 'test-comet.js', 'test-comet-send.js'),
        testHelper;

    console.log('Start of ' + numberOfSubscribers + ' test instances...');

    check3000Port(function (inUse) {
        if (inUse) {
            initCometSubscribers();
        } else {
            testHelper = fork('test-helper-util.js');

            testHelper.on('message', function (msg) {
                if (msg === 'done') {
                    initCometSubscribers();
                }
            });
        }
    });


});

gulp.task('test-ws', function () {
    var numberOfSubscribers = parseInt(process.argv.slice(4)[0], 10) || 1,
        testHelper,
        initWsSubscribers = initSubscribers.bind({}, numberOfSubscribers, 'test-ws.js', 'test-ws-send.js'),
        i;

    console.log('Start of ' + numberOfSubscribers + ' test instances...');

    check3000Port(function (inUse) {
        if (inUse) {
            initWsSubscribers();
        } else {
            testHelper = fork('test-helper-util.js');

            testHelper.on('message', function (msg) {
                if (msg === 'done') {
                    initWsSubscribers();
                }
            });
        }
    });


});

function initSubscribers(numberOfSubscribers, listenerJS, publisherJS) {
    var activeSubscribers = 0,
        i;

    for (i = 0; i < numberOfSubscribers; i++) {
        console.log('Starting ' + i + ' ' + listenerJS);

        fork(listenerJS).on('message', function (message) {
            if (message === 'done') {
                activeSubscribers++;
                console.log('Active subscribers: ' + activeSubscribers);

                if (activeSubscribers === numberOfSubscribers) {
                    console.log('Starting ' + publisherJS);

                    if (publisherJS !== 'test-ws-send.js') {
                        fork(publisherJS);
                    }
                }
            }
        });
    }
}

function check3000Port(callback) {
    tcpPortUsed.check(3000, '127.0.0.1')
        .then(callback, function (err) {
            console.error('Error on check:', err.message);
        });
}

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
