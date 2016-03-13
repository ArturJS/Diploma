(function () {

    var socket = new WebSocket("ws://localhost:10000/ws/"),
        myId,
        myCoords;

    App.controller('MainCtrl', function ($timeout, uiGmapGoogleMapApi) {
        var vm = this,
            intervalId,
            showPosition;

        vm.newMessage = '';
        vm.markers = [];
        vm.isWS = true;
        vm.isOpen = false;
        vm.toggleSettings = toggleSettings;

        vm.updateTime = 5000;
        vm.timeList = [
            500,
            1000,
            2000,
            5000,
            10000
        ];

        vm.updateInterval = updateInterval;
        init();

        function init() {

            vm.marker = {
                id: 0,
                coords: {
                    latitude: 51.602795099999994,
                    longitude: 45.9934894
                }
            };

            vm.map = {
                zoom: 16,
                options: {
                    scrollwheel: true
                },
                events: {
                    resize: function (map) {
                        google.maps.event.trigger(map, 'resize');
                    }
                }
            };

        }
        
        socket.onopen = function () {
            socket.send(JSON.stringify({
                ping: true,
                id: myId
            }));
        };

        socket.onmessage = function (event) {
            var incomingMessage = event.data;
            incomingMessage = JSON.parse(incomingMessage);
            /*console.log(incomingMessage);
            console.log(typeof incomingMessage);
            console.log('================');*/
            if (isJson(incomingMessage)){
                incomingMessage = JSON.parse(incomingMessage);
            }
            if (incomingMessage.hasOwnProperty('clientId')) {
                myId = incomingMessage.clientId;
                intervalId = setInterval(getLocation, vm.updateTime);
            } else if (incomingMessage.hasOwnProperty('removeClientId')) {
                removeMarker(incomingMessage.removeClientId);
            } else {
                console.log(incomingMessage);
                $timeout(function () {
                    addMarker(incomingMessage);
                });
            }

        };

        //subscribe();

        function subscribe() {//bug with removeClientId !!!
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
                    if (isJson(responseText)){
                        responseText = JSON.parse(responseText);
                    }
                    if (responseText.hasOwnProperty('clientId')) {
                        myId = responseText.clientId;

                        intervalId = setInterval(getLocation, vm.updateTime);
                    } else if (responseText.hasOwnProperty('removeClientId')) {
                        removeMarker(responseText.removeClientId);
                    } else {
                        $timeout(function () {
                            console.log(responseText);
                            addMarker(responseText);
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
            xhr.open("GET", 'http://localhost:10000/xhr/subscribe/?clientId=' + myId, true);
            xhr.send();
        }

        (function () {
            var alreadyCentered;

            showPosition = function (position) {
                $timeout(function () {
                    myCoords = position.coords;
                    var latitude = myCoords.latitude,
                        longitude = myCoords.longitude;

                    if (!alreadyCentered) {
                        alreadyCentered = true;
                        vm.map.center = {
                            latitude: latitude,
                            longitude: longitude
                        };
                    }

                    send({
                        latitude: latitude,
                        longitude: longitude
                    });
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
            vm.isOpen = !vm.isOpen;

        }

        function send(newCoords) {
            var message = {
                coords: newCoords
            };
            message.id = myId;
            message = JSON.stringify(message);
            if (vm.isWS) {
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

        function updateInterval() {
            clearInterval(intervalId);
            intervalId = setInterval(getLocation, vm.updateTime);
        }

        function addMarker(marker){
            var oldMarker = _.find(vm.markers, function (item) {
                return item.id === marker.id
            });

            if (!oldMarker) {
                vm.markers.push(marker);
            } else {
                angular.copy(marker, oldMarker);
            }
        }

        function removeMarker(id) {
            _.remove(vm.markers, function (marker) {
                return marker.id === id;
            });
        }

        function isJson(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        uiGmapGoogleMapApi.then(function () {
            console.log("Done!");
        });
    });

}());