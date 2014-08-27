## kloud
![NPM version](http://img.shields.io/npm/v/kloud.svg?style=flat-square)&nbsp;
![Build Status](http://img.shields.io/travis/heroicyang/kloud.svg?style=flat-square)&nbsp;
![Dependency Status](http://img.shields.io/david/heroicyang/kloud.svg?style=flat-square)
> aliyun OSS(Open Storage Service) lib. A node wrapper for [OSS RESTful API](http://imgs-storage.cdn.aliyuncs.com/help/oss/oss_api_20140814.pdf?spm=5176.383663.9.3.cnHnCQ&file=oss_api_20140814.pdf).

## Install

```bash
npm install kloud
```

## Usage

First, create an OSS client:

```javascript
var client = kloud.createClient({
  accessKeyId: '<your access key id>',
  accessKeySecret: '<your access key secret>',
  host: '<your bucket host>', // region.aliyuncs.com
  bucket: '<your bucket name>'
});
```

### PUT

Use the `Client#put(filename, headers)` method with a string or buffer to upload some strings to OSS, just like node `http.Client` request. Return a duplex stream, you can listen for a `response` event on it, and write the content using `req.end(content)`.

```javascript
var str = JSON.stringify({ foo: 'bar' });
var req = client.put('test.json', {
  'Content-Type': 'application/json',
  'Content-Length': str.length
});

req.on('response', function(res) {
  if (res.statusCode === 200) {
    console.log('file saved.');
  }
});

req.end(str);
```

Use the `Client#putFile(src, filename, headers, callback)` to upload a file to OSS:

```javascript
client.putFile('./README.md', 'readme.markdown', function(err, res) {
  // res.statusCode === 200
});
```

Or use the `Client#putStream(stream, filename, headers, callback)`:

```javascript
http.get('http://google.com/doodle.png', function(res){
  var headers = {
    'Content-Length': res.headers['content-length'],
    'Content-Type': res.headers['content-type']
  };

  client.putStream(res, 'doodle.png', headers, function(err, res){
    // res.statusCode === 200
  });
});
```

**Important: use stream mode you have to set `Content-Length` header!**

```javascript
fs.stat('./README.md', function(err, stat) {
  var headers = {
    'Content-Length': stat.size,
    'Content-Type': 'text/plain'
  };
  var req = client.put('readme.markdown', headers);

  req.on('response', function(res) {
    // res.statusCode === 200
  });

  fs.createReadStream('./README.md').pipe(req);
})
```

Also, you can use `Client.putBuffer(buffer, filename, headers, callback)` to put a string or buffer data:

```javascript
var buf = new Buffer('hello world');

client.putBuffer(buf, 'test.txt', function(err, res) {});
```

### GET

Use the `Client.get(filename, headers)` to get an OSS object:

```javascript
var req = client.get('readme.markdown');
req.on('response', function(res) {
  // res.statusCode === 200

  var chunks = [];
  var chunkLen = 0;

  res.on('data', function(chunk) {
    chunks.push(chunk);
    chunkLen += chunk.length;
  });

  res.on('end', function() {
    console.log(Buffer.concat(chunks, chunkLen).toString());
  });
});
```

Or use `Client#getFile(filename, headers, callback)`:

```javascript
client.getFile('readme.markdown', function(err, res) {
  // res.statusCode === 200

  var dest = fs.createWriteSteam('./test.md');
  res.pipe(dest);
});
```

### DELETE

Use `Client#del(filename, headers)` to delete an OSS object:

```javascript
client.del('readme.markdown').on('response', function(err, res) {
  // res.statusCode === 200
  // Deleted!
});
```

Or `Client#deleteFile(filename, headers, callback)`:

```javascript
client.deleteFile('readme.markdown', function(err, res) {});
```

You can delete **up to 1000** OSS objects at once:

```javascript
client.deleteMultiple(['test.json', 'readme.markdown'], function(err, res) {});
```
