var async = require('async');
var _url = require('url');
var fs = require('fs');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var https = require('https');
// //�յ������Ժ�
// //setId:����ID��д���ļ��Ժ󷵻����ɵ�ID
// //setData:����ID��������д���ļ�
// //getData:����ID�����ļ���ƥ������ݷ���

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

//�������Ƿ�Ϊ��
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
	 
	  //��ʼ�����
	  var resultObj = {};
	  var cacheObj = [];
	  var i = 0;
	  var checkAnchor = function(list, callback) {
	    async.mapLimit(list, 10, function(url, callback) {

	      //�ȵ�������ȥ�鿴��û���Ϊ��ȷ��
	      for (a in cacheObj) {
	        if (cacheObj[a] == url) {
	          callback(false, {
	            url: url,
	            result: false
	          });
	          return;
	        }
	      }

	      //�������µĴ�����ļ�����־
	      var errorIndex = 0;
	      var checkFunction = function() {
	        var urlObj = _url.parse(url);
	        var option = {
	          "host": urlObj.host.split(":")[0],
	          "path": urlObj.path,
	          "headers": {
	            "User-Agent": "add",
	            "Content-Length": 0
	          },
	          "rejectUnauthorized": false
	        }
	        console.log(urlObj.protocol);
	        console.log(url);
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
	            //�������δ��3�ξͽ����ط�;
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
	            //�������δ��3�ξͽ����ط�;
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
	        } else {
	        	console.log("error protocol")
	        	callback(false, {
	                url: url,
	                result: true
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
	    	//ȥ��SPM�����
	      anchorList.push(result[1].replace(/&amp;/g, '&').replace( /(&)spm=[^&]+/,"" ).replace(/(spm)=.+&/,"").replace(/(spm)=.+/,""));
	    }
	    if (anchorList.length) {
	      callback(false, anchorList);
	    } else {
	      console.log('��ȡҳ���ڵ�A���ӣ�����û��A����')
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
	      "host": urlObj.host.split(":")[0],
	      "path": urlObj.path,
	      "headers": {
	        "User-Agent": "add",
	        "Content-Length": 0
	      },
	      "rejectUnauthorized": false
	    }
	    // console.log(urlObj.path)

	    if (urlObj.protocol == "http:") {
	      console.log("start http");
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
	          callback("���ص��Ǵ���ҳ��");
	        }

	      }).on('error', function() {
	        callback("����ҳ�淢������");
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
	            callback(false, body)
	          });
	        } else if ((resa.statusCode >= 300 && resa.statusCode < 400 && !(res.headers && res.headers.location && res.headers.location.indexOf("wrongpage") >= 0 ))) {
	          // getPage(res.headers.location,callback);
	          getPage(res.headers.location, callback);
	          return;
	        } else {
	          callback("���ص��Ǵ���ҳ��");
	        }
	      }).on('error', function() {
	        callback("����ҳ�淢������");
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
	    //������ѽ��д���ļ�
	    dataEvent.setData(id, resultObj);
	    resultObj = {};
	  });
	});


	app.get("/getResult", function(req, res) {
	  var param = req.query.id;

	  //��ȡ�ļ�����
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
	  fs.writeFileSync('data/data.txt', '{}', 'utf-8');
	}, 86400000);

}
exports.mult = mult