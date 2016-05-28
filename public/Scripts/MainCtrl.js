(function () {

    var socket = new WebSocket("ws://localhost:10000/ws/"),
        myId,
        myCoords;

    App.controller('MainCtrl', function ($timeout, uiGmapGoogleMapApi) {
        var vm = this,
            intervalId,
            showPosition,
            wsReconnectInterval;

        vm.newMessage = '';
        vm.markers = [];
        vm.isWS = false;
        vm.isOpen = false;
        vm.mapLoaded = false;
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

            /*vm.marker = {
             id: 0,
             coords: {
             latitude: 51.602795099999994,
             longitude: 45.9934894
             }
             };*/

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
            clearInterval(wsReconnectInterval);
            socket.send(JSON.stringify({
                type: 'ping',
                id: myId
            }));
        };

        socket.onmessage = function (event) {
            var data = JSON.parse(event.data);
            processData(data);
        };

        socket.onerror = function () {
            clearInterval(wsReconnectInterval);
            wsReconnectInterval = setInterval(function () {
                socket = new WebSocket("ws://localhost:10000/ws/");
            }, 5000);
        };

        subscribe();

        function subscribe() {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function (event) {
                var target = event.target,
                    status = target.status,
                    statusText = target.statusText,
                    readyState = target.readyState,
                    data = target.responseText;
                if (readyState != 4) return;

                console.log(this);
                if (status == 200) {
                    data = JSON.parse(data);
                    processData(data);

                    subscribe();
                    return;
                }

                if (status != 404) { // 404 может означать, что сервер перезагружается
                    console.log(statusText); // показать ошибку
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
            vm.isOpen ^= 1;
        }

        function send(newCoords) {
            if (!myId) {
                return;
            }
            var message = {
                type: 'coords',
                id: myId,
                coords: newCoords
            };
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

        function updateInterval(newId) {
            if (angular.isDefined(newId)) {
                myId = newId;
            }

            clearInterval(intervalId);
            intervalId = setInterval(getLocation, vm.updateTime);
        }

        function addMarker(marker) {
            var oldMarker = _.find(vm.markers, function (item) {
                return item.id === marker.id;
            });

            $timeout(function () {
                if (!oldMarker) {
                    vm.markers.push(marker);
                } else {
                    angular.copy(marker, oldMarker);
                }
            });
        }

        function removeMarker(id) {
            _.remove(vm.markers, function (marker) {
                return marker.id === id;
            });
        }

        function processData(data) {
            switch (data.type) {
                case 'newClient' :
                    updateInterval(data.clientId);
                    break;
                case 'removeClient' :
                    removeMarker(data.removeClientId);
                    break;
                case 'coords' :
                    addMarker(data);
                    break;
            }
        }

        uiGmapGoogleMapApi.then(function () {
            vm.mapLoaded = true;
        });
    });

}());