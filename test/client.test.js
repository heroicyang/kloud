/**
 * Module dependencies
 */
var path = require('path');
var fs = require('fs');
var test = require('tape');
var kloud = require('../lib');

var filepath = path.join(__dirname, '..', 'README.md');
var fileBuffer = fs.readFileSync(filepath);
var objectName = 'README.md';

var client = kloud.createClient({
  accessKeyId: '9BEMD2aTsxg9mFJK',
  accessKeySecret: 'oWadlaZ6TecruAACKSpjtSasEHWB5y',
  host: 'oss-cn-qingdao.aliyuncs.com',
  bucket: 'kloud'
});

test('Client#put', function(t) {
  t.plan(2);

  t.test('request', function(tt) {
    var content = '## kloud';
    var req = client.put(objectName, {
      'Content-Length': content.length
    });

    req.on('response', function(res) {
      tt.equal(res.statusCode, 200, 'should put string ok');
      tt.end();
    });

    req.end(content);
  });

  t.test('teardown', function(tt) {
    client.del(objectName).on('response', function(res) {
      tt.equal(res.statusCode, 204, 'teardown successed');
      tt.end();
    });
  });
});

test('Client#putFile', function(t) {
  t.plan(2);

  t.test('request', function(tt) {
    client.putFile(filepath, objectName, function(err, res) {
      tt.error(err, 'should not throw an error');
      tt.equal(res.statusCode, 200, 'should put file ok');
      tt.end();
    });
  });

  t.test('teardown', function(tt) {
    client.del(objectName).on('response', function(res) {
      tt.equal(res.statusCode, 204, 'teardown successed');
      tt.end();
    });
  });
});

test('Client#putStream', function(t) {
  t.plan(2);

  t.test('request', function(tt) {
    var fileSize = fs.statSync(filepath).size;
    var fileStream = fs.createReadStream(filepath);

    client.putStream(fileStream, objectName, {
      'Content-Length': fileSize
    }, function(err, res) {
      tt.error(err, 'should not throw an error');
      tt.equal(res.statusCode, 200, 'should put stream ok');
      tt.end();
    });
  });

  t.test('teardown', function(tt) {
    client.del(objectName).on('response', function(res) {
      tt.equal(res.statusCode, 204, 'teardown successed');
      tt.end();
    });
  });
});

test('Client#putBuffer', function(t) {
  t.plan(2);

  t.test('request', function(tt) {
    client.putBuffer(fileBuffer, objectName, function(err, res) {
      tt.error(err, 'should not throw an error');
      tt.equal(res.statusCode, 200, 'should put buffer ok');
      tt.end();
    });
  });

  t.test('teardown', function(tt) {
    client.del(objectName).on('response', function(res) {
      tt.equal(res.statusCode, 204, 'teardown successed');
      tt.end();
    });
  });
});

test('Client#get', function(t) {
  t.plan(3);

  t.test('setup', function(tt) {
    client.putFile(filepath, objectName, function(err, res) {
      tt.equal(res.statusCode, 200, 'setup successed');
      tt.end();
    });
  });

  t.test('request', function(tt) {
    client.get(objectName).on('response', function(res) {
      tt.equal(res.statusCode, 200,  'should get object ok');

      var chunkLen = 0;
      res.on('data', function(chunk) {
        if (chunk) {
          chunkLen += chunk.length;
        }
      });

      res.on('end', function() {
        tt.equal(chunkLen, fileBuffer.length, 'should get the correct object');
        tt.end();
      });
    });
  });

  t.test('teardown', function(tt) {
    client.del(objectName).on('response', function(res) {
      tt.equal(res.statusCode, 204, 'teardown successed');
      tt.end();
    });
  });
});

test('Client#getFile', function(t) {
  t.plan(3);

  t.test('setup', function(tt) {
    client.putFile(filepath, objectName, function(err, res) {
      tt.equal(res.statusCode, 200, 'setup successed');
      tt.end();
    });
  });

  t.test('request', function(tt) {
    client.getFile(objectName, function(err, res) {
      tt.error(err, 'should not throw an error');
      tt.equal(res.statusCode, 200, 'should get file ok');

      var chunkLen = 0;
      res.on('data', function(chunk) {
        if (chunk) {
          chunkLen += chunk.length;
        }
      });

      res.on('end', function() {
        tt.equal(chunkLen, fileBuffer.length,  'should get the correct file');
        tt.end();
      });
    });
  });

  t.test('teardown', function(tt) {
    client.del(objectName).on('response', function(res) {
      tt.equal(res.statusCode, 204, 'teardown successed');
      tt.end();
    });
  });
});

test('Client#del', function(t) {
  t.plan(2);

  t.test('setup', function(tt) {
    client.putFile(filepath, objectName, function(err, res) {
      tt.equal(res.statusCode, 200, 'setup successed');
      tt.end();
    });
  });

  t.test('request', function(tt) {
    client.del(objectName).on('response', function(res) {
      tt.equal(res.statusCode, 204, 'should delete object ok');
      tt.end();
    });
  });
});

test('Client#deleteFile', function(t) {
  t.plan(2);

  t.test('setup', function(tt) {
    client.putFile(filepath, objectName, function(err, res) {
      tt.equal(res.statusCode, 200, 'setup successed');
      tt.end();
    });
  });

  t.test('request', function(tt) {
    client.deleteFile(objectName, function(err, res) {
      tt.error(err, 'should not throw an error');
      tt.equal(res.statusCode, 204, 'should delete file ok');
      tt.end();
    });
  });
});
