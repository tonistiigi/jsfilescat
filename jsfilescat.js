#!/usr/bin/env node
var fs = require('fs')
var asyncMap = require('slide').asyncMap
var combine = require('combine-source-map')
var assert = require('assert')
var path = require('path')

function cat(files, opt) {
  if (opt.out) {
    var out = fs.createWriteStream(opt.out)
    var name = opt.name || path.basename(opt.out)
  }
  else {
    out = process.stdout
    name = argv.name || 'jsfilesbundle.js'
  }

  var bundle = combine.create(name)
  var lines = 0
  files.forEach(function(f) {
    var source = fs.readFileSync(f, {encoding: 'utf8'})
    bundle.addFile({
      source: source,
      sourceFile: path.resolve(f)
    }, {line: lines})
    var src = combine.removeComments(source)
    out.write((lines ? ';' : '') + src + '\n')
    lines += getLFCount(src) + 1
  })

  var base64 = bundle.base64()
  if (opt.mapout) {
    var mappath = path.relative(opt.out ? path.dirname(opt.out) : process.cwd(), opt.mapout)
    fs.writeFileSync(opt.mapout, base64, {encoding: 'base64'})
    out.write('//# sourceMappingURL=' + mappath)
  }
  else {
    out.write('//# sourceMappingURL=data:application/json;base64,' + base64)
  }
  //console.log(JSON.parse(Buffer(base64, 'base64').toString()))
}

function getLFCount(str) {
  var count = 0
  for (var i = 0; i < str.length; i++) {
    if (str[i] === '\n') count++
  }
  return count
}

module.exports = cat

if (!module.parent) {
  var argv = require('optimist').demand(1).argv
  cat(argv._, argv)
}