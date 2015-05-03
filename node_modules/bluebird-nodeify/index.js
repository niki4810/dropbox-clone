var Promise = require('bluebird')
function nodeify(promise, cb, options) {
  if (typeof cb !== 'function') return promise
  return promise.then(function (ret) {
    if (options && options.spread && Array.isArray(ret)) {
      cb.apply(null, [null].concat(ret))
    } else cb(null, ret)
  }, cb)
}
nodeify.Promise = Promise

module.exports = nodeify
