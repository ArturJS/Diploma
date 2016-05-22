App.controller('MainCtrl', function ($scope) {
    var vm = this;

    vm.chartOptions = {
        chart: {
            type: 'line'
        }
    };

    vm.statisticList = [
        {
            title: 'Instance 1',
            config:{
                options: {
                    chart: {
                        type: 'line',
                        zoomType: 'x'
                    }
                },
                series: [{
                    data: [10, 15, 12, 8, 7, 1, 1, 19, 15, 10]
                }],
                title: {
                    text: 'Hello'
                },
                xAxis: {currentMin: 0, currentMax: 10, minRange: 1},
                loading: false
            }
            /*config: {
                series: [{
                    data: [10, 15, 12, 8, 7]
                }],
                options: vm.chartOptions,
                useHighStocks: true
            }*/

        }
    ];

});