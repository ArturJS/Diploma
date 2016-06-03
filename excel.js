var fs = require('fs');
var _ = require('lodash');
var excelbuilder = require('msexcel-builder');

////crazy run ======> node --max-old-space-size=4000 --expose-gc excel.js -i 91 100
//parseTxt('comet-statistic');
//parseTxt('ws-statistic');

parseStatistic('comet-statistic');
parseStatistic('ws-statistic');

function parseTxt(txtName) {

    fs.readFile(txtName + '.txt', function (err, data) {
        if (err) {
            return console.error(err);
        }

        var linesArr = data.toString().split('\r\n'),
            workbook = excelbuilder.createWorkbook('./', txtName + '.xlsx'),
            processArgv = process.argv.slice(3),
            rangeStart = parseInt(processArgv[0], 10),
            rangeEnd = parseInt(processArgv[1], 10),
            testObjects = {},
            sheets = {},
            inRange,
            maxLines = 0;

        inRange = function (start, end, value) {
            return start <= value && value <= end;
        }.bind({}, rangeStart, rangeEnd);

        _.forEach(linesArr, function (line) {//map data from string to lists of arrays of params
            var words = line.split(' '),
                params = words.slice(0, 3),//copy [instanceName, id, delay]
                lineIndex = words[1];

            testObjects[lineIndex] = testObjects[lineIndex] || [];

            params.push(words.slice(3).join(' '));//adding time
            testObjects[lineIndex].push(params);
        });

        _.forEach(testObjects, function (value) {//sort lists for every testInstance by time
            if (maxLines < value.length) {
                maxLines = value.length;
            }

            value.sort(function (a, b) {
                return a[3] > b[3];//compare by time
            });
        });

        //console.dir(testObjects);
        console.log(maxLines);

        _.forEach(testObjects, function (value, key) {//write all data to sheets
            if (!inRange(key)) {
                return;
            }

            var sheet = sheets[key] = workbook.createSheet('sheet' + key, 10, maxLines),
                listOfParams = value,
                listOfParamsLength = listOfParams.length + 1,
                i, j;

            if (listOfParamsLength > 101) {
                listOfParamsLength = 101;
            }

            for (i = 0; i < listOfParamsLength; i++) {
                if (!_.isUndefined(listOfParams[i])) {
                    for (j = 0; j < 4; j++) {
                        console.log('key=' + key + ' i=' + i + ' j=' + j);
                        sheet.set(j + 1, i + 1, listOfParams[i][j]);
                    }
                }
            }


            if (global.gc) {
                global.gc();
            } else {
                console.log('Garbage collection unavailable.  Pass --expose-gc '
                    + 'when launching node to enable forced garbage collection.');
            }
        });

        workbook.save(function (ok) {//save to excel file
            if (!ok) {
                workbook.cancel();
                console.log('Error with saving in ' + txtName + '.xlsx file!')
            }
        });
    });
}

function parseStatistic(txtName) {

    fs.readFile(txtName + '.txt', function (err, data) {
        if (err) {
            return console.error(err);
        }

        var linesArr = data.toString().split('\r\n'),
            workbook = excelbuilder.createWorkbook('./', txtName + '.xlsx'),
            sheet = workbook.createSheet(txtName, 10, 500),
            testObjects = {},
            finalStatistics = [],
            i;

        _.forEach(linesArr, function (line) {//map data from string to lists of arrays of params
            var words = line.split(' '),
                lineIndex = words[1];//instance id

            testObjects[lineIndex] = testObjects[lineIndex] || [];

            testObjects[lineIndex].push(parseInt(words[2], 10));//push only delay
        });

        for (i = 0; i < 100; i++) { //take the second hundred of statistics for clean results
            finalStatistics.push(0);
            _.forEach(testObjects, function (valuesArr, index) {

                if (!_.isUndefined(valuesArr[i])) {
                    finalStatistics[i] += valuesArr[i];
                }

            });
            finalStatistics[i] /= 100;
        }

        for (i = 0; i < 100; i++) {
            sheet.set(1, i + 1, finalStatistics[i]);
        }

        console.log(txtName);
        console.dir(finalStatistics);

        workbook.save(function (ok) {//save to excel file
            if (!ok) {
                workbook.cancel();
                console.log('Error with saving in ' + txtName + '.xlsx file!')
            }
        });
    });


}