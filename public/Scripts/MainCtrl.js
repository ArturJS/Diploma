(function () {

    var socket = new WebSocket("ws://localhost:10000/ws/"),
        wsId,
        xhrId,
        myCoords;

    App.controller('MainCtrl', function ($scope, $timeout, uiGmapGoogleMapApi) {
        var intervalId,
            showPosition;

        $scope.newMessage = '';
        $scope.messageList = [];
        $scope.isWS = false;
        $scope.isOpen = false;
        $scope.toggleSettings = toggleSettings;

        $scope.updateTime = 1000;
        $scope.timeList = [
            500,
            1000,
            2000,
            5000,
            10000
        ];
        $scope.send = send;
        $scope.updateTimeout = updateTimeout;
        init();

        function init() {
            intervalId = setInterval(getLocation, $scope.updateTime);

            $scope.map = {
                zoom: 16,
                options: {
                    scrollwheel: false
                },
                events: {
                    resize: function (map) {
                        google.maps.event.trigger(map, 'resize');
                    }
                }
            };

            $scope.marker = {
                id: 1
            };

        }

        socket.onmessage = function (event) {
            var incomingMessage = event.data;
            incomingMessage = JSON.parse(incomingMessage);
            if (incomingMessage.hasOwnProperty('clientId')) {
                wsId = incomingMessage.clientId;
            } else {
                $timeout(function () {
                    $scope.messageList.push(incomingMessage.text);
                });
            }

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
                    responseText = JSON.parse(responseText);
                    if (responseText.hasOwnProperty('clientId')) {
                        xhrId = responseText.clientId;
                    } else {
                        $timeout(function () {
                            $scope.messageList.push(responseText.text);
                        });
                    }
                    subscribe();
                    return;
                }

                if (status != 404) { // 404 может означать, что сервер перезагружается
                    console.log(this.statusText); // показать ошибку
                }

                setTimeout(subscribe, 1000); // попробовать ещё раз через 1 сек
            };
            xhr.open("GET", 'http://localhost:10000/xhr/subscribe/?clientId=' + xhrId, true);
            xhr.send();
        }

        (function(){
            var alreadyCentered;

            showPosition = function (position) {
                $timeout(function () {
                    myCoords = position.coords;
                    var latitude = myCoords.latitude,
                        longitude = myCoords.longitude;

                    if (!alreadyCentered) {
                        alreadyCentered = true;
                        $scope.map.center = {
                            latitude: latitude,
                            longitude: longitude
                        };
                    }

                    $scope.marker.coords = {
                        latitude: latitude,
                        longitude: longitude
                    };
                });
            }
        }());

        getLocation();
        function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(showPosition);
            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        }

        function toggleSettings() {
            $scope.isOpen = !$scope.isOpen;

        }

        function send() {
            var message = {
                text: $scope.newMessage
            };
            message.id = $scope.isWS ? wsId : xhrId;
            message = JSON.stringify(message);
            if ($scope.isWS) {
                socket.send(message);
            } else {
                sendXhrMessage(message);
            }
        }

        function sendXhrMessage(message) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:10000/xhr/publish/", true);//XHR here!
            xhr.send(message);
        }

        function updateTimeout() {
            clearInterval(intervalId);
            intervalId = setInterval(getLocation, $scope.updateTime);
        }

        uiGmapGoogleMapApi.then(function () {
            console.log("Done!");
        });
    });

}());