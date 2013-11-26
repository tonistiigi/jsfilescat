#!/usr/bin/env node
var fs = require('fs')
var combine = require('combine-source-map')
var path = require('path')

function cat(files, opt) {
  if (opt.out) {
    var out = typeof opt.out === 'string' ? fs.createWriteStream(opt.out) : opt.out
    var name = opt.name || path.basename(opt.out)
  }
  else {
    out = process.stdout
    name = argv.name || 'jsfilesbundle.js'
  }
  var tmpsrc = ''

  var bundle = combine.create(name)
  var lines = 0
  files.forEach(function(f) {
    var source = fs.readFileSync(f, {encoding: 'utf8'})
    bundle.addFile({
      source: source,
      sourceFile: path.resolve(f)
    }, {line: lines})
    var src = combine.removeComments(source)
    tmpsrc += (lines && !opt.css ? ';' : '') + src + '\n'
    lines += getLFCount(src) + 1
  })

  var base64 = bundle.base64()
  if (opt['nouglify'] || opt.css) {
    out.write(tmpsrc)
  }
  else {
    var UglifyJS = require('uglify-js')
    var toplevel = UglifyJS.parse(tmpsrc, {filename: name})
    toplevel.figure_out_scope()
    var compressed = toplevel.transform(UglifyJS.Compressor({
      warnings: opt.warnings === undefined ? true : opt.warnings
    }))
    compressed.figure_out_scope()
    compressed.compute_char_frequency()
    compressed.mangle_names()
    var mapjson = JSON.parse(Buffer(base64, 'base64').toString())
    var sourcemap = UglifyJS.SourceMap({
      file: name,
      orig: mapjson
    })
    var stream = UglifyJS.OutputStream({source_map: sourcemap})
    compressed.print(stream)
    var code = stream.toString()
    var map = JSON.parse(sourcemap.toString())
    // UglifyJS map does not keep the sourcesContent
    // Sources array gets sorted for some reason
    map.sourcesContent = []
    for (var i = 0; i < map.sources.length; i++) {
      var index = mapjson.sources.indexOf(map.sources[i])
      map.sourcesContent[i] = mapjson.sourcesContent[index]
    }
    out.write(code + '\n')
    base64 = Buffer(JSON.stringify(map)).toString('base64')
  }
  if (!opt['nomap']) {
    if (opt.mapout) {
      if (typeof opt.mapout === 'string') {
        var mappath = path.relative(opt.out ? path.dirname(opt.out) : process.cwd(), opt.mapout)
        opt.mapout = fs.createWriteStream(opt.mapout)
      }
      else {
        mappath = opt.mapname || name + '.json'
      }
      opt.mapout.write(Buffer(base64, 'base64'))
      opt.mapout.end()
      out.write(sourceMapComment(mappath, opt.css))
    }
    else {
      out.write(sourceMapComment('data:application/json;base64,' + base64, opt.css))
    }
  }
  out.end()
}

function sourceMapComment(data, isCSS) {
  var out = isCSS ? '/*' : '//'
  out += '# sourceMappingURL=' + data
  if (isCSS) out += ' */'
  return out
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