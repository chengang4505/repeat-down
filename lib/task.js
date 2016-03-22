'use strict';
var util = require('util');
var EventEmitter = require('events');
var http = require('http');
var https = require('https');
var url = require("url");
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var tools = require('./tools.js');


function DownloadTask(option) {
    if (!option.url) {
        throw  new Error("no url arg!");
    }
    if (!option.dest) {
        throw  new Error("no dest arg!");
    }
    this.start = option.start || 0;
    this.timeout = option.timeout || 5000;
    this.url = option.url;
    this.dest = option.dest;
    EventEmitter.call(this);
    //this = option;
    this._isBreak = false;
    this.process = 0;
    this.reclen = 0;
}
util.inherits(DownloadTask, EventEmitter);

DownloadTask.prototype.run = function () {
    var _this = this;
    var _http;
    var options = url.parse(_this.url);
    options.headers = {'Range': "bytes=" + _this.start + "-"};

    if(options.protocol === 'https:'){
        _http = https;
    }else if(options.protocol === 'http:'){
        _http = http;
    }else{
        throw  new Error('valid protocol. only support https and http.')
        return;
    }

    var httpclient = _http.get(options, function (res) {
        //console.log(res.statusCode);
        //console.log(res.headers);
        if (res.statusCode !== 206 && res.statusCode !== 200) {
            _this._handleDone(new Error("404 error"));
            return;
        }

        if (res.statusCode === 206) {
            _this._isBreak = true;
            _this.totalLen = parseInt(res.headers['content-range'].split('/')[1]);
        } else {
            _this.totalLen = parseInt(res.headers['content-length']);
        }
        _this._handleData(res);

    });

    httpclient.on('error', function () {
        _this._handleDone(new Error("network error"));
    });

    httpclient.setTimeout(_this.timeout, function () {
        _this._handleDone(new Error("timeout error"));
        httpclient.abort();
        if(_this._file){
            _this._file.uncork();
            _this._file.end();
            _this._file = null;
        }
    });

};

DownloadTask.prototype._handleDone = function (err) {
    if (this._downloadError) return;
    if (err) {
        this._downloadError = true;
    }
    this.emit('done', err, this);
};

DownloadTask.prototype._handleData = function (res) {
    var _this = this;
    var dir = path.dirname(_this.dest);
    if (!tools.isFileExist(dir)) {
        mkdirp.sync(dir);
    }

    var flag = _this._isBreak ? 'a+' : 'w+';
    _this._file = fs.createWriteStream(_this.dest, {flags: flag, defaultEncoding: 'binary'});
    res.pipe(_this._file);

    res.on("data", function (chunk) {
        _this.reclen += chunk.length;
        if (!_this._downloadError) {
            _this.curChunk = chunk;
            _this.process = parseFloat(((_this.reclen + _this.start) * 100 / _this.totalLen).toFixed(1));
            _this.emit('process', _this.process, _this);
        }
    });
    res.on('error', function () {
        _this._handleDone(new Error("receive data error"));
    });
    _this._file.on('error', function () {
        _this._handleDone(new Error("file write data error"));
    });
    res.on('end', function () {
        _this._file.uncork();
        _this._file.end();
        _this._handleDone(null);
    });
};


module.exports = DownloadTask;