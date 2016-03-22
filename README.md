# repeat-down
multi-tasking download files and support  continue transferring from breakpoint  repeattly.

    npm install repeat-down

##example

```javascript
    var path = require('path');
    var RepeatDown = require('repeat-down');
    
    //{maxRun} max tasks in running, {repeatNum} the auto repeat times internally  if a task failed .
    //{timeout} the connection timeout.
    var downloader = new RepeatDown({maxRun: 6, timeout: 5000, repeatNum: 4});
    
    downloader.get({
        url:'http://download.sublimetext.com/Sublime%20Text%20Build%203103%20x64%20Setup.exe',
        dest:path.join(__dirname, 'temp', 'test.zip')
    }).get({
        url:'http://download.sublimetext.com/Sublime%20Text%20Build%203103%20x64%20Setup.exe',
        dest:path.join(__dirname, 'temp', 'test2.zip')
    }).run(function(percent,task){//percent callback {percent: 0-100}
    
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

            //you can call this to continue run the errtasks.
            //downloader.restartErrTasks(errtasks);
        }else{
            console.log('all complete.');
        }
        
    });
```

#methods

###RepeatDown(option)

```javascript
    var RepeatDown = require('repeat-down');
    var downloader = new RepeatDown({maxRun: 6, timeout: 5000, repeatNum: 4});
```

create a downloader.
```option``` a obj with some propertys.<br>

```timeout```[number] the connection timeout ,default 5000(milliscond).<br>
```maxRun```[number] the max running tasks ,default 5.<br>
```repeatNum```[number] max auto repeat times if a task failed ,default 10.<br>
```delayTime```[number] a increasing time for every repeat ,default 500(milliscond).<br>

###.get(option)

```javascript
downloader.get({
        url:'http://download.sublimetext.com/Sublime%20Text%20Build%203103%20x64%20Setup.exe',
        dest:path.join(__dirname, 'temp', 'test.zip')
    })
```

add tasks.<br>
```option``` is a obj|array. propertys below.<br>

```url```[string] the quest url of a file.<br>
```dest```[string] the filepath.<br>

###.run(processCallback,doneCallback,doneAllCallback)

```javascript
    downloader.run(processCallback(percent, task),doneCallback(err, task),doneAllCallback(errtasks));
```

run the tasks.

```processCallback``` the process callback. ```percent``` a percent for every task in range 0 - 100. ```task``` is a obj.<br>
```doneCallback``` the callback for every task when complete or failed.<br>
```doneAllCallback``` the global callback. ```errtasks``` is a array of failed tasks. optionly you cal call ```downloader.restartErrTasks(errtasks)``` to continue the failed tasks.<br>

###.restartErrTasks(errtasks)

restart the failed tasks. if need you can call many times until all tasks complete.<br>


###Task

task has some propertys below:

```start```[number] the start point(byte) in download stream for breakpoint resume.<br>
```timeout```[number] connection timeout.<br>
```url```[string] quest url.<br>
```dest``` [string]filepath.<br>
```_isBreak```[boolean] whether if surpport breakpoint resume for the task.<br>
```process``` [number]a percent of  the process.<br>
```reclen``` [number] current received length. ```start+reclen``` is the total received length.<br>
```totalLen```[number] the total lenght of the file will be received.<br>


