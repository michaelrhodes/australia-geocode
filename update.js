var fs = require('fs')
var path = require('path')
var parse = require('csv-parser')
var flush = require('flush-write-stream')
var pump = require('pump')
var get = require('simple-get')
var through = require('through2')
var stringify = JSON.stringify

var source = 'https://raw.githubusercontent.com/allenhori/AustraliaGeocode/master/Australian.Suburbs.and.Geocodes.csv'

var index = path.resolve(__dirname, 'index.js')
var data = path.resolve(__dirname, 'data.ndjson')

get(source, function (err, res) {
  if (err) throw err

  pump(res, parse(), edit(), write(), function (err) {
    if (err) throw err
  })
})

function edit (ps) {
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

function write () {
  var i = 0
  var is = fs.createWriteStream(index)
  var ds = fs.createWriteStream(data)
  is.write('module.exports = [\n')

  return flush(function (line, enc, next) {
    ds.write(line + '\n')
    is.write((i++ ? ',\n' : '') + '  ' + line
      .toString()
      .replace(/'/g, "\\'")
      .replace(/"/g, "'")
      .replace(/^{/, '{ ')
      .replace(/}$/, ' }')
      .replace(/'([^']+)':/g, '$1: ')
      .replace(/,([a-z])/g, ', $1'))
    next()
  },
  function (done) {
    is.write('\n]')
    is.end()
    ds.end()
    done()
  })
}
