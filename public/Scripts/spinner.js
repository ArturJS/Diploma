'use strict';

angular
    .module('App')
    .directive('spinner', function () {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'spinner.html'
        };
    });

