var path = require('path');
var Multiprogress = require("multi-progress");
var Downloader = require('./index.js');

var down = new Downloader({maxRun: 6, timeout: 1000, repeatNum: 4});
var arr = [];
for (var i = 0; i < 20; i++) {
    arr.push({
        url: 'http://tx.static.mathfunfunfun.com/update/patch/win-0-pjl-201603181511-pst/update__win_eclass_for_pst_p9060_201603181511_pjl.zip',
        dest: path.join(__dirname, 'temp', 'test' + i + '.zip')
    });
}
down.get(arr);

//title progress
var multi = new Multiprogress(process.stderr);
var title = multi.newBar('total info:(runningTask)|:num1 (waitedTask)|:num2 (errTask)|:num3 (globalRepeat)|:repeat', {
    complete: '=',
    incomplete: ' ',
    width: 30,
    total: 100000
});

var repeat = 0;
var bars = {};
down.run(function (percent, task) {//percent callback
    var dest = task.dest;
    if (!bars[dest]) {
        bars[dest] = multi.newBar(path.parse(task.dest).base + ':  [:bar] :percent :etas  :code', {
            complete: '=',
            incomplete: ' ',
            width: 30,
            total: 100
        });
        bars[dest].per = 0;
        bars[dest].code = '';
    }
    bars[dest].tick(percent - bars[dest].per, {code: bars[dest].code});
    bars[dest].per = percent;
}, function (err, task) {//single task callback ,maybe completed or have a error.
    var dest = task.dest;
    if (err) {
        if (!bars[dest]) {
            bars[dest] = multi.newBar(path.parse(task.dest).base + ':  [:bar] :percent :etas  :code', {
                complete: '=',
                incomplete: ' ',
                width: 30,
                total: 100
            });
            bars[dest].per = 0;
            bars[dest].code = '';
        }
        bars[dest].code = err.message;
        bars[dest].tick(0, {code: bars[dest].code});
    }
    else {
        bars[dest].tick(100, {code: 'ok'});
    }
}, function (errtasks) {//all tasks callback,errtasks are array of err task, you can call restartErrTasks to continue running  the err tasks.
    repeat++;
    down.restartErrTasks(errtasks);
});

setInterval(function () {
    title.tick({
        'num1': down._runTasks.length,
        'num2': down._waiteTasks.length,
        num3: down._errTasks.length,
        repeat: repeat
    });
}, 300);

