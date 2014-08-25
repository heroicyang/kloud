/**
 * Module dependencies
 */
var crypto = require('crypto');

/**
 * Merge object `b` with object `a`.
 *
 * @param  {Object} a
 * @param  {Object} b
 * @return {Object}
 */
exports.merge = function(a, b) {
  var keys = Object.keys(b || {});
  for (var i = 0, len = keys.length; i < len; ++i) {
    var key = keys[i];
    a[key] = b[key];
  }
  return a;
};

/**
 * MD5
 *
 * @param  {String} message
 * @return {String}
 */
exports.md5 = function(message) {
  return crypto.createHash('md5').update(message).digest('base64');
};
