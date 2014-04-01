var async = require('async');
var _url = require('url');
var fs = require('fs');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var https = require('https');
// //收到请求以后
// //setId:生成ID，写入文件以后返回生成的ID
// //setData:根据ID，把数据写入文件
// //getData:根据ID，把文件中匹配的数据返回

var dataEvent = {
    setId: function() {

      var date = (new Date()).valueOf();
      var data = fs.readFileSync('data/data.txt', 'utf-8');
      data = JSON.parse(data);
      data[date] = {};
      data = JSON.stringify(data);
      fs.writeFileSync('data/data.txt', data, 'utf-8');
      return date;
    },
    setData: function(id, arr) {
      // console.log(id);
      var data = fs.readFileSync('data/data.txt', 'utf-8');
      data = JSON.parse(data);
      data[id] = arr;
      // console.log(data);
      data = JSON.stringify(data);
      fs.writeFileSync('data/data.txt', data, 'utf-8');
    },
    getData: function(id) {
      var data = fs.readFileSync('data/data.txt', 'utf-8');
      data = JSON.parse(data);
      data = data[id] ? data[id] : {};
      return data;
    }
  };

//检测对象是否为空
var testObj = function(obj) {
  for (var j in obj) {
    return false;
  }
  return true;
}
function mult(app) {

	app.get("/multcheck", function(req, res) {
	  var urllist = req.query.data;
	  console.log(dataEvent);
	  var id = dataEvent.setId();
	  res.json({
	    "success": "true",
	    "info": "start",
	    "id": id
	  });
	 
	  //开始检查了
	  var resultObj = {};
	  var cacheObj = [];
	  var i = 0;
	  var checkAnchor = function(list, callback) {
	    async.mapLimit(list, 10, function(url, callback) {

	      //先到缓存里去查看有没标记为正确的
	      for (a in cacheObj) {
	        if (cacheObj[a] == url) {
	          callback(false, {
	            url: url,
	            result: false
	          });
	          return;
	        }
	      }

	      //这是留下的错误检查的计数标志
	      var errorIndex = 0;
	      var checkFunction = function() {
	        var urlObj = _url.parse(url);
	        var option = {
	          "host": urlObj.host,
	          "path": urlObj.path,
	          "headers": {
	            "User-Agent": "add",
	            "Content-Length": 0
	          },
	          "rejectUnauthorized": false
	        }
	        if (urlObj.protocol == "http:") {
	          var req = http.get(option, function(res) {
	            var result = (res.statusCode === 404) || (res.statusCode >= 500) || ( (res.statusCode >= 300) && (res.statusCode < 400) && (res.statusCode >= 300 && res.statusCode < 400 && (res.headers && res.headers.location && res.headers.location.indexOf("wrongpage") >= 0 )));

	            if (result && errorIndex <= 2) {
	              errorIndex++;
	              checkFunction(url, callback);
	            } else {
	              if (!result) {
	                cacheObj.push(url)
	              }
	              callback(false, {
	                url: url,
	                result: result
	              })
	            }
	            req.abort();

	          }).on('error', function(e) {
	            //如果错误未满3次就进行重发;
	            if (errorIndex <= 2) {
	              errorIndex++;
	              checkFunction(url, callback);

	            } else {
	              callback(false, {
	                url: url,
	                result: true
	              });
	            }

	          });

	        } else if (urlObj.protocol == "https:") {
	          var req = https.get(option, function(res) {
	            var result = (res.statusCode === 404) || (res.statusCode >= 500) || ((res.statusCode >= 300) && (res.statusCode < 400) && (res.statusCode >= 300 && res.statusCode < 400 && (res.headers && res.headers.location && res.headers.location.indexOf("wrongpage") >= 0 )));
	            if (result && errorIndex <= 2) {
	              errorIndex++;
	              checkFunction(url, callback);
	            } else {
	              callback(false, {
	                url: url,
	                result: result
	              })
	              if (!result) {
	                cacheObj.push(url)
	              }
	            }
	            req.abort();
	          }).on('error', function(e) {
	            //如果错误未满3次就进行重发;
	            if (errorIndex <= 2) {
	              arguments.callee(url, callback);
	            } else {
	              callback(false, {
	                url: url,
	                result: true
	              });
	            }
	          });
	        }
	      }
	      checkFunction()

	    }, callback);
	  }
	  var filterResult = function(list, callback) {
	    async.filter(list, function(obj, callback) {
	      // console.log(obj);
	      callback(obj.result);
	    }, function(results) {
	      callback(false, results);
	    });
	  }
	  var getAnchor = function(str, callback) {
	    var result, anchorList = [],
	      pattern = new RegExp('<a[^>]*href=[\'"](http[^\'"]*)[\'"][^>]*?>', 'g');
	    while ((result = pattern.exec(str)) != null) {
	      anchorList.push(result[1].replace(/&amp;/g, '&'));
	    }
	    if (anchorList.length) {
	      callback(false, anchorList);
	    } else {
	      console.log('获取页面内的A链接，发现没有A链接')
	      callback(false, ["http://www.baidu.com"]);
	    }
	  }
	  var putObj = function(result, callback) {
	    async.eachSeries(result, function(obj, callback) {
	      // console.log(i);
	      // console.log(obj.url);
	      resultObj[i].error.push(obj.url);
	      callback();
	    }, function(err) {
	      // console.log(err);
	      callback();
	      i++;
	    });
	  }

	  var getPage = function(url, callback) {
	  	console.log(url)
	    var urlObj = _url.parse(url);

	    var option = {
	      "host": urlObj.host,
	      "path": urlObj.path,
	      "headers": {
	        "User-Agent": "add",
	        "Content-Length": 0
	      },
	      "rejectUnauthorized": false
	    }
	    // console.log(urlObj.path)

	    if (urlObj.protocol == "http:") {
	      console.log("start http")
	      req = http.get(option, function(res) {
	        if (res.statusCode == 200) {
	          var body = '';
	          res.on('data', function(chunk) {
	            body += chunk;
	          });
	          res.on('end', function(chunk) {

	            callback(false, body)
	          });
	        } else if ((res.statusCode >= 300) && (res.statusCode < 400) && !(resa.statusCode >= 300 && resa.statusCode < 400 && (res.headers && res.headers.location && res.headers.location.indexOf("wrongpage") >= 0 ))) {

	          getPage(res.headers.location, callback);
	          return;
	        } else {
	          callback("返回的是错误页面");
	        }

	      }).on('error', function() {
	        callback("请求页面发生错误");
	      });
	    } else if (urlObj.protocol == "https:") {
	      console.log("start https")
	      req = https.get(option, function(res) {
	        if (res.statusCode == 200) {
	          var body = '';
	          res.on('data', function(chunk) {
	            body += chunk;
	          });
	          res.on('end', function(chunk) {
	            console.log(body);
	            callback(false, body)
	          });
	        } else if ((resa.statusCode >= 300 && resa.statusCode < 400 && !(res.headers && res.headers.location && res.headers.location.indexOf("wrongpage") >= 0 ))) {
	          // getPage(res.headers.location,callback);
	          getPage(res.headers.location, callback);
	          return;
	        } else {
	          callback("返回的是错误页面");
	        }
	      }).on('error', function() {
	        callback("请求页面发生错误");
	      });
	    }

	  };

	  var checkPage = function(url, callback) {
	    async.waterfall([
	      function(callback) {
	        resultObj[i] = {
	          url: url,
	          error: []
	        }
	        callback(false, url);
	      },
	      getPage,
	      getAnchor,
	      checkAnchor,
	      filterResult,
	      putObj
	    ], callback);
	  };

	  async.eachSeries(urllist.linklist, checkPage, function(err) {
	    console.log(err);
	    console.log(resultObj);
	    // console.log(cacheObj);
	    //在这里把结果写入文件
	    dataEvent.setData(id, resultObj);
	    resultObj = {};
	  });
	});


	app.get("/getResult", function(req, res) {
	  var param = req.query.id;

	  //读取文件内容
	  if (testObj(dataEvent.getData(param))) {
	    res.json({
	      "status": "false",
	      "data": {}
	    });
	  } else {
	    res.json({
	      "status": "success",
	      "data": dataEvent.getData(param)
	    })
	  }
	});

	var time = setInterval(function() {
	  fs.writeFileSync('data/data.txt', {}, 'utf-8');
	}, 86400000);

}
exports.mult = mult