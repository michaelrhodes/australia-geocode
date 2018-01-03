var fs = require('fs')
var path = require('path')
var write = require('flush-write-stream')
var ndjson = require('ndjson')
var pump = require('pump')
var read = fs.createReadStream
var parse = ndjson.parse

var data = path.resolve(__dirname, 'data.ndjson')

module.exports = consume

function consume (fn) {
  pump(read(data), parse(), whatever(), fn)

  function whatever (sync) {
    return write.obj(function (suburb, enc, next) {
      if (sync = fn(null, suburb, function () {
        if (!sync) next()
      }) !== void 0) next()
    })
  }
}
