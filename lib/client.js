/**
 * Module dependencies
 */
var fs = require('fs');
var hyperquest = require('hyperquest');
var mime = require('mime');
var once = require('once');
var debug = require('debug')('kloud:client');
var auth = require('./auth');
var utils = require('./utils');

/**
 * Expose `Client`
 */
module.exports = exports = Client;

/**
 * Create a new oss client
 *
 * @param {Object} options
 */
exports.createClient = function(options) {
  return new Client(options);
};

/**
 * OSS client
 *
 * @param {Object} options
 *   - {String} accessKeyId
 *   - {String} accessKeySecret
 *   - {String} host
 *   - {String} bucket
 */
function Client(options) {
  options = options || {};
  if (!options.accessKeyId) {
    throw new Error('oss "accessKeyId" required');
  }
  if (!options.accessKeySecret) {
    throw new Error('oss "accessKeySecret" required');
  }
  if (!options.host) {
    throw new Error('oss "host" required');
  }
  if (!options.bucket) {
    throw new Error('oss "bucket" required');
  }

  if (!(this instanceof Client)) {
    return new Client(options);
  }

  utils.merge(this, options);
}

var proto = Client.prototype;

/**
 * Request with `filename` the given `method`, and optional `headers`.
 *
 * @param  {String}  method
 * @param  {String}  filename
 * @params {Object}  headers
 * @return {Stream}
 */
proto.request = function(method, filename, headers) {
  headers = headers || {};

  headers.Date = new Date().toGMTString();
  headers.Host = this.host;

  var url = 'http://' + this.host + '/' + this.bucket + '/' + filename;
  var resource = '/' + this.bucket + '/' + filename;

  headers.Authorization = auth.authorization({
    accessKeyId: this.accessKeyId,
    accessKeySecret: this.accessKeySecret,
    verb: method,
    resource: resource,
    headers: headers
  });

  var req = hyperquest(url, { method: method, headers: headers });
  req.url = url;
  return req;
};

/**
 * PUT data to `filename` with optional `headers`.
 *
 * @param  {String} filename
 * @param  {Object} headers
 * @return {Stream}
 */
proto.put = function(filename, headers) {
  headers = utils.merge({}, headers || {});
  return this.request('PUT', filename, headers);
};

/**
 * PUT the file at `src` to `filename`, with `callback` function.
 *
 * @param {String}   src
 * @param {String}   filename
 * @param {Object}   headers
 * @param {Function} callback Callback function with (err, res)
 */
proto.putFile = function(src, filename, headers, callback) {
  if ('function' === typeof headers) {
    callback = headers;
    headers = {};
  }

  debug('put %s', src);

  var client = this;
  fs.stat(src, function(err, stat) {
    if (err) {
      return callback(err);
    }

    headers['Content-Type'] = mime.lookup(src);
    headers['Content-Length'] = stat.size;

    var stream = fs.createReadStream(src);
    client.putStream(stream, filename, headers, callback);
  });
};

/**
 * PUT the given `stream` as `filename` with `headers`.
 * `headers` must contain `'Content-Length'` at least.
 *
 * @param  {Stream} stream
 * @param  {String} filename
 * @param  {Object} headers
 * @param  {Function} callback Callback function with (err, res)
 * @return {Stream}
 */
proto.putStream = function(stream, filename, headers, callback) {
  if ('function' === typeof headers) {
    callback = headers;
    headers = {};
  }

  if (!headers['Content-Length']) {
    process.nextTick(function() {
      callback(new Error('You must specify a Content-Length header.'));
    });
    return;
  }

  callback = once(callback);

  var req = this.put(filename, headers);

  req.on('response', function(res) {
    callback(null, res);
  });
  req.on('error', callback);
  stream.on('error', callback);

  stream.pipe(req);
  return req;
};

/**
 * PUT the given `buffer` as `filename` with optional `headers`.
 *
 * @param  {Buffer}   buffer
 * @param  {String}   filename
 * @param  {Object}   headers
 * @param  {Function} callback Callback function with (err, res)
 * @return {Stream}
 */
proto.putBuffer = function(buffer, filename, headers, callback) {
  if ('function' === typeof headers) {
    callback = headers;
    headers = {};
  }

  headers['Content-Length'] = buffer.length;
  callback = once(callback);

  var req = this.put(filename, headers);
  req.on('response', function(res) {
    callback(null, res);
  });
  req.on('error', callback);

  req.end(buffer);
  return req;
};

/**
 * DELETE `filename` with optional `headers`.
 *
 * @param  {String} filename
 * @param  {Object} headers
 * @return {Stream}
 */
proto.del = function(filename, headers) {
  return this.request('DELETE', filename, headers);
};

/**
 * DELETE `filename` with optional `headers` and `callback`
 *
 * @param  {String} filename
 * @param  {Object} headers
 * @param  {Function} callback Callback function with (err, res)
 */
proto.deleteFile = function(filename, headers, callback) {
  if ('function' === typeof headers) {
    callback = headers;
    headers = {};
  }

  callback = once(callback);

  var req = this.del(filename, headers);
  req.on('response', function(res) {
    callback(null, res);
  });
  req.on('error', callback);

  return req;
};

/**
 * Copy file from `sourceFilename` to `destFilename` with optional `headers`.
 *
 * @param  {String} sourceFilename
 * @param  {String} destFilename
 * @param  {Object} headers
 * @return {Stream}
 */
proto.copy = function(sourceFilename, destFilename, headers) {
  headers = headers || {};
  headers['x-oss-copy-source'] = '/' + this.bucket + '/' + sourceFilename;

  return this.put(destFilename, headers);
};

/**
 * Copy file from `sourceFilename` to `destFilename` with optional `headers` and `callback`.
 *
 * @param  {String} sourceFilename
 * @param  {String} destFilename
 * @param  {Object} headers
 * @param  {Function} callback    Callback function with (err, res)
 * @return {Stream}
 */
proto.copyFile = function(sourceFilename, destFilename, headers, callback) {
  if ('function' === typeof headers) {
    callback = headers;
    headers = {};
  }

  callback = once(callback);

  var req = this.copy(sourceFilename, destFilename, headers);
  req.on('response', function(res) {
    callback(null, res);
  });
  req.on('error', callback);

  return req;
};

/**
 * GET `filename` with optional `headers`.
 *
 * @param  {String} filename
 * @param  {Object} headers
 * @return {Stream}
 */
proto.get = function(filename, headers) {
  return this.request('GET', filename, headers);
};

/**
 * GET `filename` with optional `headers` and `callback`
 *
 * @param  {String} filename
 * @param  {Object} headers
 * @param  {Function} callback Callback function with (err, res)
 */
proto.getFile = function(filename, headers, callback) {
  if ('function' === typeof headers) {
    callback = headers;
    headers = {};
  }

  callback = once(callback);

  var req = this.get(filename, headers);
  req.on('response', function(res) {
    callback(null, res);
  });
  req.on('error', callback);

  return req;
};

/**
 * Issue a `HEAD` request on `filename` with optional `headers`.
 *
 * @param  {String} filename
 * @param  {Object} headers
 * @return {Stream}
 */
proto.head = function(filename, headers) {
  return this.request('HEAD', filename, headers);
};

/**
 * Issue a `HEAD` request on `filename` with optional `headers` and `callback`.
 *
 * @param  {String} filename
 * @param  {Object} headers
 * @param  {Function} callback Callback function with (err, res)
 */
proto.headFile = function(filename, headers, callback) {
  if ('function' === typeof headers) {
    callback = headers;
    headers = {};
  }

  callback = once(callback);

  var req = this.head(filename, headers);
  req.on('response', function(res) {
    callback(null, res);
  });
  req.on('error', callback);

  return req;
};
