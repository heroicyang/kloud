/**
 * Module dependencies.
 */
var crypto = require('crypto');
var parse = require('url').parse;
var debug = require('debug')('kloud:auth');

/**
 * Query string params permitted in the canonicalized resource.
 */
var whitelist = [
  'acl',
  'group',
  'uploadId',
  'partNumber',
  'uploads',
  'logging',
  'response-content-type',
  'response-content-language',
  'response-expires',
  'reponse-cache-control',
  'response-content-disposition',
  'response-content-encoding'
];

/**
 * Return an "Authorization" header value with the given `options`
 * in the form of "OSS " + Access Key Id + ":" + Signature
 *
 * Signature:
 * 
 *    base64(hmac-sha1(Access Key Secret + "\n"
 *      + VERB + "\n"
 *      + CONTENT-MD5 + "\n"
 *      + CONTENT-TYPE + "\n"
 *      + DATE + "\n"
 *      + CanonicalizedossHeaders
 *      + CanonicalizedResource))
 *
 * @param  {Object} options
 * @return {String}
 */
exports.authorization = function(options) {
  var auth = 'OSS ' + options.accessKeyId + ':';
  var params = [
    options.verb.toUpperCase(),
    options.headers['Content-MD5'],
    options.headers['Content-Type'],
    options.headers.Date || new Date().toGMTString()
  ];
  var ossHeaders = exports.canonicalizeHeaders(options.headers);

  if (ossHeaders) {
    params.push(ossHeaders);
  }

  params.push(exports.canonicalizeResource(options.resource));

  debug('authorization with params: %j', params);

  var signature = crypto.createHmac('sha1', options.accessKeySecret);
  signature = signature.update(params.join('\n')).digest('base64');

  return auth + signature;
};

/**
 * Generate `CanonicalizedossHeaders`
 *
 * Spec:
 *
 *    - ignore none x-oss- headers
 *    - lowercase fields
 *    - sort lexicographically
 *    - trim whitespace between field and value
 *    - join with newline
 *
 * @param {Object} headers
 * @return {String}
 */
exports.canonicalizeHeaders = function(headers) {
  var ossHeaders = [];

  Object.keys(headers).forEach(function(field) {
    var lfield = field.toLowerCase().trim();
    if (lfield.indexOf('x-oss-') === 0) {
      ossHeaders.push(lfield + ':' + headers[field].trim());
    }
  });

  var headerSort = function(a, b) {
    a = a.split(':')[0];
    b = b.split(':')[0];

    return a > b ? 1 : -1;
  };

  return ossHeaders.sort(headerSort).join('\n');
};

/**
 * Generate `CanonicalizedResource`
 *
 * Spec:
 *
 *    - ignore non sub-resource
 *    - ignore non override headers
 *    - sort lexicographically
 *
 * @param {String} resource
 * @return {String}
 */
exports.canonicalizeResource = function(resource) {
  var url = parse(resource, true);
  var path = url.pathname;
  var querys = [];

  Object.keys(url.query).forEach(function(field) {
    if (whitelist.indexOf(field) !== -1) {
      querys.push(field + (url.query[field] ? '=' + url.query(field) : ''));
    }
  });

  return path + (querys.length ? '?' + querys.sort().join('&') : '');
};
