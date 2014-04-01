//多页面的请求
var express = require('express');
var http = require('http');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
//单个链接请求逻辑
var single = require("./single");
single.single( app );

//多页面请求逻辑
var mult = require("./mult");
mult.mult( app );


http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

