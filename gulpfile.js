(function () {
    'use strict';
    var gulp = require('gulp');
    var exec = require('child_process').exec;

    gulp.paths = {
        scripts: 'Scripts',
        portal: 'Portal',
        ilp: 'ILP'
    };
    var paths = gulp.paths;

    //require('require-dir')('./gulp');

    gulp.task('serve', function (done) {
        exec('nodemon static-server.js', callback);
        exec('nodemon server-helper-util.js', callback);
    });

    function callback(error, stdout, stderr) {
        if (error) console.log(error.code);
    }

    /*gulp.task('default', ['clean'], function (done) {
        runSequence(['recompile_and_watch_sass', 'eslint_onChange'], done);
    });*/
}());