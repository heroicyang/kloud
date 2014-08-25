## kloud

> aliyun OSS(Open Storage Service) lib. A node wrapper for [OSS RESTful API](http://imgs-storage.cdn.aliyuncs.com/help/oss/oss_api_20140814.pdf?spm=5176.383663.9.3.cnHnCQ&file=oss_api_20140814.pdf).

Inspired by [knox](https://github.com/LearnBoost/knox)!

## Install

```bash
npm install kloud --save
```

## Usage

```javascript
var client = kloud.createClient({
  accessKeyId: '<your access key id>',
  accessKeySecret: '<your access key secret>',
  host: '<your bucket host>', // region.aliyuncs.com
  bucket: '<your bucket name>'
});
```

### PUT

```javascript
var str = JSON.stringify({ foo: 'bar' });
var req = client.put('/test.json', {
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
