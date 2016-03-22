var path = require('path');
var RepeatDown = require('./index.js');

//{maxRun} max tasks in running, {repeatNum} the auto repeat times internally  if a task failed .
//{timeout} the connection timeout.
var downloader = new RepeatDown({maxRun: 6, timeout: 5000, repeatNum: 4});

downloader.get({
    url:'http://download.sublimetext.com/Sublime%20Text%20Build%203103%20x64%20Setup.exe',
    dest:path.join(__dirname, 'temp', 'test.zip')
}).get({
    url:'http://download.sublimetext.com/Sublime%20Text%20Build%203103%20x64%20Setup.exe',
    dest:path.join(__dirname, 'temp', 'test2.zip')
}).run(function(percent,task){//percent callback

    console.log('file:'+task.dest+' : '+percent);

},function(err,task){//single task callback ,maybe completed or have a error.

    if(err){
        console.log('download err :'+task.url);
    }else{
        console.log('download complete :'+task.url);
    }

},function(errtasks){//all tasks callback,errtasks are array of err task,

    if(errtasks.length > 1){
        console.log('failed tasks :'+errtasks.length);

        //you call this to continue run the errtasks.
        //downloader.restartErrTasks(errtasks);
    }else{
        console.log('all complete.');
    }

});