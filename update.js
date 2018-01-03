var fs = require('fs')
var path = require('path')
var parse = require('csv-parser')
var flush = require('flush-write-stream')
var pump = require('pump')
var get = require('simple-get')
var through = require('through2')
var stringify = JSON.stringify

var source = 'https://raw.githubusercontent.com/allenhori/AustraliaGeocode/master/Australian.Suburbs.and.Geocodes.csv'

var file = path.resolve(__dirname, 'index.js')

get(source, function (err, res) {
  if (err) throw err

  pump(res, parse(), rewrite(), format(), write(file), function (err) {
    if (err) throw err
  })
})

function rewrite (ps) {
  return through.obj(function (s, enc, next) {
    var state = s.States.toUpperCase().replace(/[^A-Z]/g, '')
    var postcode = Number(s.Postcode)

    if (ps === 'OT' && state !== 'OT') this.push(stringify({
      name: 'NORFOLK ISLAND',
      state: 'OT',
      postcode: 2899,
      coords: [167.95, -29.03]
    }))

    if (!postcode) return next()

    next(null, stringify({
      name: s.Suburb,
      state: ps = state,
      postcode: postcode,
      coords: [Number(s.Longitude), Number(s.Lattitude)]
    }))
  })
}

function format () {
  return through(function (line, enc, next) {
    next(null, line
      .toString()
      .replace(/'/g, "\\'")
      .replace(/"/g, "'")
      .replace(/^{/, '{ ')
      .replace(/}$/, ' }')
      .replace(/'([^']+)':/g, '$1: ')
      .replace(/,([a-z])/g, ', $1'))
  })
}

function write (file) {
  var i = 0
  var ws = fs.createWriteStream(file)
  ws.write('module.exports = [\n')

  return flush(function (line, enc, next) {
    ws.write((i++ ? ',\n' : '') + '  ' + line)
    next()
  },
  function (done) {
    ws.write('\n]')
    ws.end()
    done()
  })
}
