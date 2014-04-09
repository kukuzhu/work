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
		console.log("�µĿ�ʼ");
		// �õ��ӿ���� url ����
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
	  //�������оͲ�������ȥ��
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
	    var reqa = http.get(options, function(resa) { // ȥ�����������
	      // console.log(resa.statusCode);
	      // console.log(resa.headers);
	      // console.log(resa.statusCode >= 300 && resa.statusCode < 400 && (resa.headers && resa.headers.location && res.headers.location.indexOf("wrongpage") >= 0))
	      if (resa.statusCode == "404" || resa.statusCode >= 500 || (resa.statusCode >= 300 && resa.statusCode < 400 && (resa.headers && resa.headers.location && resa.headers.location.indexOf("wrongpage") >= 0 ))) { // �鿴״̬��Ϣ���� 404 ��������
	      	console.log("��������")
	      	if( index >= 3 ) {
		      	res.json({
		          'succ': "true",
		          "i": i
		        });
	      	} else {
	      		console.log("���¿�ʼ")
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
	    }).on('error', function() { // ����Ҳ������
	      	if( index >= 3 ) {
		      	res.json({
		          'succ': "true",
		          "i": i
		        });
	      	} else {
	      		
	      		console.log("���¿�ʼ")
	      		startCheck(req,res,++index);
	      	}

	    }).on("end", function() {});


	  } else if (protocol == "https:") {
	    var reqa = https.request(options, function(resa) {

	      if (resa.statusCode == "404" || resa.statusCode >= 500 || (resa.statusCode >= 300 && resa.statusCode < 400 && (resa.headers && resa.headers.location && resa.headers.location.indexOf("wrongpage") >= 0 ))) { // �鿴״̬��Ϣ���� 404 ��������
	      	if( index >= 3 ) {
		      	res.json({
		          'succ': "true",
		          "i": i
		        });
	      	} else {
	      		console.log("���¿�ʼ")
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
	      		console.log("���¿�ʼ")
	      		startCheck(req,res,++index);
	      	}
	    });
	    reqa.end();
	  }
	}
	//�����ǵ�ҳ���
	//ȥ������֤����
	app.get('/reglist', function(req, res) {
	  res.json({
	    "data": reg.reglist
	  });
	});
	//������ҳ����
	app.get('/check', function(req, res) {
		startCheck(req,res,0);
	  
	});
}

exports.single = single