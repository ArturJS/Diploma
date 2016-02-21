var App = angular.module('App', []);

(function () {

    var socket = new WebSocket("ws://localhost:10000/ws/");
    //var xhr;


    App.controller('MainCtrl', function ($scope, $timeout) {
        $scope.newMessage = '';
        $scope.messageList = [];

        $scope.isWS = false;

        $scope.send = function () {
            if ($scope.isWS) {
                socket.send($scope.newMessage);
            } else {
                sendMessage($scope.newMessage);
            }
        };

        function sendMessage(message) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:10000/xhr/publish/", true);//XHR here!
            xhr.send(message);
        }


        socket.onmessage = function (event) {
            var incomingMessage = event.data;

            $timeout(function () {
                $scope.messageList.push(incomingMessage);
            });
        };

        subscribe();

        function subscribe() {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function (event) {
                var target = event.target,
                    status = target.status,
                    statusText = target.statusText,
                    readyState = target.readyState,
                    responseText = target.responseText;
                if (readyState != 4) return;

                console.log(this);
                if (status == 200) {
                    $timeout(function () {
                        $scope.messageList.push(responseText);
                    });
                    subscribe();
                    return;
                }

                if (status != 404) { // 404 может означать, что сервер перезагружается
                    console.log(this.statusText); // показать ошибку
                }

                setTimeout(subscribe, 1000); // попробовать ещё раз через 1 сек
            };
            xhr.open("GET", 'http://localhost:10000/xhr/subscribe/', true);
            xhr.send();
        }

    });

    getLocation();
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            console.log("Geolocation is not supported by this browser.");
        }
    }

    function showPosition(position) {
        initialize(position.coords.latitude, position.coords.longitude);
    }


    function initialize(latitude, longitude) {
        var myLatlng = new google.maps.LatLng(latitude, longitude),
            myOptions = {
                zoom: 20,
                center: myLatlng,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            },
            map = new google.maps.Map(angular.element('.map-container')[0], myOptions),
            marker = new google.maps.Marker({
                map: map,
                position: myLatlng,
                title: 'You are here!'
            });
    }
}());


$('.chat_window').resizable();