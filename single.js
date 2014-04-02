var routes = require('./routes');
var http = require('http');
var https = require('https');
var reg = require('./reglist');
var _url = require('url');
var cache = [];
var clearCache = setInterval(function() {
	  cache = [];
	}, 86400000);
var single = function(app){
	
	var startCheck = function(req,res,index){
		console.log(index)
		console.log("新的开始");
		// 拿到接口里的 url 参数
	  var url = req.query.zhuliqiurl,
	    urlObj = _url.parse(url),
	    i = req.query.i;

	  var protocol = urlObj.protocol,
	    host = urlObj.host,
	    path = urlObj.path;

	  var options = {
	    "host": host,
	    "path": path,
	    "headers": {
	      "User-Agent": "add",
	      "Content-Length": 0
	    },
	    "rejectUnauthorized": false
	  }
	  //缓存里有就不继续下去了
	  for( var a in cache ) {
	  	if( cache[a] == url ) {
	  		res.json({
	          'succ': "false",
	          "i": i
	        });
	        return
	  	}
	  }
	  if (protocol == "http:") {
	    var reqa = http.get(options, function(resa) { // 去请求这个链接
	      // console.log(resa.statusCode);
	      // console.log(resa.headers);
	      // console.log(resa.statusCode >= 300 && resa.statusCode < 400 && (resa.headers && resa.headers.location && res.headers.location.indexOf("wrongpage") >= 0))
	      if (resa.statusCode == "404" || resa.statusCode >= 500 || (resa.statusCode >= 300 && resa.statusCode < 400 && (resa.headers && resa.headers.location && resa.headers.location.indexOf("wrongpage") >= 0 ))) { // 查看状态信息，是 404 就是死链
	      	console.log("出现死链")
	      	if( index >= 3 ) {
		      	res.json({
		          'succ': "true",
		          "i": i
		        });
	      	} else {
	      		console.log("重新开始")
	      		startCheck(req,res,++index);
	      	}
	      } else {
	      	res.json({
	          'succ': "false",
	          "i": i
	        });
	        cache.push(url);
	      }
	      reqa.abort();
	      // console.log(i);
	      // console.log(resa.statusCode);
	    }).on('error', function() { // 出错也是死链
	      	if( index >= 3 ) {
		      	res.json({
		          'succ': "true",
		          "i": i
		        });
	      	} else {
	      		
	      		console.log("重新开始")
	      		startCheck(req,res,++index);
	      	}

	    }).on("end", function() {});


	  } else if (protocol == "https:") {
	    var reqa = https.request(options, function(resa) {

	      if (resa.statusCode == "404" || resa.statusCode >= 500 || (resa.statusCode >= 300 && resa.statusCode < 400 && (resa.headers && resa.headers.location && resa.headers.location.indexOf("wrongpage") >= 0 ))) { // 查看状态信息，是 404 就是死链
	      	if( index >= 3 ) {
		      	res.json({
		          'succ': "true",
		          "i": i
		        });
	      	} else {
	      		console.log("重新开始")
	      		startCheck(req,res,++index);
	      	}
	      } else {
	        res.json({
	          'succ': "false",
	          "i": i
	        })
	        cache.push(url);
	      }
	      reqa.abort();
	    });
	    reqa.on('error', function(e) {
	      	if( index >= 3 ) {
		      	res.json({
		          'succ': "true",
		          "i": i
		        });
	      	} else {
	      		console.log("重新开始")
	      		startCheck(req,res,++index);
	      	}
	    });
	    reqa.end();
	  }
	}
	//这里是单页面的
	//去请求验证规则
	app.get('/reglist', function(req, res) {
	  res.json({
	    "data": reg.reglist
	  });
	});
	//启动单页面检查
	app.get('/check', function(req, res) {
		startCheck(req,res,0);
	  
	});
}

exports.single = single