Concatenate and compress JS files together while keeping all original sourcemaps.

`jsfilescat <options> file1 file2`
  
Options:

- `out` - Output source file. Defaults to stdout.
- `mapout` - Output sourcemap file. If not set base64 encoded map is added to the end of the source file.
- `nouglify` - Skip compression.
- `nomap` - Skip source map generation.
- `name` - Output filename(used in sourcemap).
