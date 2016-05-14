'use strict';
var gulp = require('gulp');
var exec = require('child_process').exec;

//require('require-dir')('./gulp');

gulp.task('serve', function (done) {
    exec('start restart-nginx.bat', callback);
    exec('nodemon static-server.js', callback);
    exec('nodemon server-helper-util.js', callback);
    exec('nodemon ws-server.js', callback);
    exec('nodemon ws-server.js', callback);
    exec('nodemon comet-server.js', callback);
    exec('nodemon comet-server.js', callback);
});

function callback(error, stdout, stderr) {
    if (error) console.log(error.code);
}

process.on( 'SIGINT', function() {
    console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
    exec('start stop-nginx.bat', function () {
        console.log('Done!');
        process.exit(0);
    });
});
