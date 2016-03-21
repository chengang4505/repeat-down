
var fs = require('fs');

var tools = {};

tools.isFileExist = function(file){
    var isExist = false;
    try{
        fs.accessSync(file,fs.F_OK);
        isExist = true;
    }catch(e){
        isExist = false;
    }

    return isExist;
};

tools._once = function(fn){
    return function(){
        if(fn === null) return;
        fn.apply(this,arguments);
        fn = null;
    };
};

tools._bind = function(scope,fn){
    return function(){
        fn.apply(scope,arguments);
    }
};




module.exports = tools;
