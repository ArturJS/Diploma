'use strict';
/**
 * @file refresh-scroll-on-dom-change.js
 *
 * @author Artur_Nizamutdinov
 * @date 2/20/2016
 */
(function () {
    'use strict';

    angular
        .module('App')
        .directive('refreshScrollOnDomChange', refreshScrollOnDomChange);

    function refreshScrollOnDomChange() {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, elem, attrs) {
            var $elem = angular.element(elem),
                updateScrollbar = _.throttle(function () {
                    $elem.scrollTop(elem[0].scrollHeight);
                }, 150);

            $elem.bind('DOMSubtreeModified', function () {
                updateScrollbar();
            });
        }
    }
}());
