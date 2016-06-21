'use strict';

angular
    .module('App')
    .directive('uxSelect', function ($timeout) {
        return {
            restrict: 'EA',
            templateUrl: 'ux-select.html',
            scope: {
                isOpen: '=?',
                list: '=',
                value: '=',
                onChange: '&'
            },
            link: function (scope, elem, attrs) {
                var currentIndex,
                    $list = elem.find('.ux-select-list');

                if (angular.isUndefined(scope.value)) {
                    currentIndex = 0;
                    scope.value = scope.list[0];
                } else {
                    currentIndex = _.findIndex(scope.list, function (item) {
                        return item === scope.value;
                    });
                }

                scope.toggleOpen = function () {
                    scope.isOpen ^= 1;
                };

                scope.selectItem = function (index) {
                    currentIndex = index;
                    scope.value = scope.list[index];
                    $timeout(function () {
                        scope.onChange();
                    });
                    closeList();
                };

                scope.selected = function (index) {
                    return index === currentIndex;
                };

                function closeList() {
                    scope.isOpen = 0;
                }

            }
        };

    });

