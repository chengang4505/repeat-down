'use strict';

var task = require('./lib/task.js');
var path = require('path');
var fs = require('fs');
var tools = require('./lib/tools.js');

function Downloader(option) {
    if(!option) option = {};
    option.timeout = option.hasOwnProperty('timeout') ? option.timeout : 5000;
    option.maxRun = option.hasOwnProperty('maxRun') ? option.maxRun : 5;
    option.repeatNum = option.hasOwnProperty('repeatNum') ? option.repeatNum : 10;
    option.delayTime = option.delayTime || 500;
    this._option = option;

    this._waiteTasks = [];
    this._runTasks = [];
    this._errTasks = [];
}
Downloader.prototype.get = function (option) {
    var _this = this;
    if(Array.isArray(option)){
        option.forEach(function(e){
            e.timeout = _this._option.timeout;
            _this._waiteTasks.push(new task(e));
        });
    }else{
        option.timeout = _this._option.timeout;
        _this._waiteTasks.push(new task(option));
    }

    return this;
};
Downloader.prototype.run = function (processFn, doneFn, alldoneFn) {
    this._process = processFn;
    this._done = doneFn;
    this._alldone = alldoneFn;

    var n = this._option.maxRun;
    while (this._waiteTasks.length > 0 && n > 0) {
        n--;
        this._runtask();
    }
};
Downloader.prototype._processFun = function(percent,task){
    this._process(percent,task);
};
Downloader.prototype._restartTask =function(task){
    this._updateTaskInfo(task);
    task.run();
};
Downloader.prototype._doneFun = function(err,task){
    if(!err){
        this._done(null,task);
        this._rmtask(this._runTasks,task);
        this._runtask();
        return;
    }
    if(task._isBreak && (task._repeatNum < this._option.repeatNum)){
        task._repeatNum++;
        setTimeout(tools._bind(this,this._restartTask),this._option.delayTime*task._repeatNum,task);

    }else{
        this._done(err,task);
        this._rmtask(this._runTasks,task);
        this._errTasks.push(task);
        this._runtask();
    }
};
Downloader.prototype._updateTaskInfo = function(task){
    var size = 0;
    try{
        size = fs.statSync(task.dest).size;
    }catch (e){
        size = 0;
    }
    task.start = size;
    task.reclen = 0;
    task._downloadError = false;
};
Downloader.prototype._runtask = function(){
    if(this._waiteTasks.length === 0 && this._runTasks.length === 0){
        var errTasks = this._errTasks;
        this._errTasks = [];
        this._alldone(errTasks);
        return;
    }
    if(this._waiteTasks.length < 1) return;
    var t = this._waiteTasks.shift();
    t._repeatNum = 0;
    this._runTasks.push(t);
    t.removeAllListeners('done');
    t.removeAllListeners('process');
    t.on('done',tools._bind(this,this._doneFun));
    t.on('process',tools._bind(this,this._processFun));
    t.run();
};
Downloader.prototype._getUrls = function(tasks){
    var urls = [];
    tasks.forEach(function(t){
        urls.push({url: t.url,isBreak: t._isBreak});
    });
    return urls;
};
Downloader.prototype._rmtask = function(tasks,task){
    for(var i = 0;i<tasks.length;i++){
        if(tasks[i] === task){
            tasks.splice(i,1);
            break;
        }
    }
};
Downloader.prototype.restartErrTasks =function(tasks){
    if(tasks.length < 1) return;
    for(var i=0;i<tasks.length;i++){
        tasks[i]._repeatNum = 0;
        this._updateTaskInfo(tasks[i]);
        if(this._runTasks.length < this._option.maxRun){
            this._runTasks.push(tasks[i]);
            tasks[i].run();
        }else{
            this._waiteTasks.push(tasks[i]);
        }
    }


};
module.exports = Downloader;