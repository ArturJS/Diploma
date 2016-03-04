(function () {

    var socket = new WebSocket("ws://localhost:10000/ws/");

    App.controller('MainCtrl', function ($scope, $timeout, uiGmapGoogleMapApi) {
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

        getLocation();
        function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(showPosition);
            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        }

        function showPosition(position) {
            $timeout(function () {
                var coords = position.coords,
                    latitude = coords.latitude,
                    longitude = coords.longitude;

                $scope.map = {
                    center:{
                        latitude: latitude,
                        longitude: longitude
                    },
                    zoom: 16
                };

                $scope.marker = {
                    id: 1,
                    coords: {
                        latitude: latitude,
                        longitude: longitude
                    }
                };

                $scope.options = {scrollwheel: false};

            });

            uiGmapGoogleMapApi.then(function () {
               console.log("Done!");
            });

        }
    });

}());