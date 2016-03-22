var path = require('path');
var Multiprogress = require("multi-progress");
var Downloader = require('./index.js');



var down = new Downloader({maxRun: 6, timeout: 5000, repeatNum: 4});
var arr = [];
for (var i = 0; i < 20; i++) {
    arr.push({
        url: 'http://download.sublimetext.com/Sublime%20Text%20Build%203103%20x64%20Setup.exe',
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



function getBar(schema) {
    var bar = multi.newBar(schema, {
        complete: '=',
        incomplete: ' ',
        width: 30,
        total: 100
    });
    bar.per = 0;
    bar.code = '';
    return bar;
}



var repeat = 0;
var bars = {};
down.run(taskProcess,doneForEveryTask ,doneAllTasks );


//percent callback
function taskProcess(percent, task){
    var dest = task.dest;
    if (!bars[dest]) {
        bars[dest] = getBar(path.parse(task.dest).base + ':  [:bar] :percent :etas  :code');
    }
    bars[dest].tick(percent - bars[dest].per, {code: bars[dest].code});
    bars[dest].per = percent;
}
//single task callback ,maybe completed or have a error.
function doneForEveryTask(err, task){
    var dest = task.dest;
    if (err) {
        if (!bars[dest]) {
            bars[dest] = getBar(path.parse(task.dest).base + ':  [:bar] :percent :etas  :code');
        }
        bars[dest].code = err.message;
        bars[dest].tick(0, {code: bars[dest].code});
    }
    else {
        bars[dest].tick(100, {code: 'ok'});
    }
}
//all tasks callback,errtasks are array of err task, you can call restartErrTasks to continue running  the err tasks.
function doneAllTasks(errtasks){
    repeat++;
    down.restartErrTasks(errtasks);//[option]
}



setInterval(function () {
    title.tick({
        'num1': down._runTasks.length,
        'num2': down._waiteTasks.length,
        num3: down._errTasks.length,
        repeat: repeat
    });
}, 300);

