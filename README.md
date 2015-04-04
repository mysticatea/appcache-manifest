# appcache-manifest

A CLI tool to generate HTML5 Application Cache Manifest.

`appcache-manifest` generates a manifest file from specified file globs.
And regenerates when everytime files changed!

`appcache-manifest` makes `md5` hash code of all cache files, and adds it into
the result file.

## Installation

```
npm install appcache-manifest
```


## Usage

```
Usage: appcache-manifest [OPTIONS] [FILES...]

  FILES: File globs that includes into manifest.

  -o, --output <FILE_PATH>    A path of the output file.  By default, print to
                              stdout.
  -p, --prefix <PATH>         A prefix parts for each path of cache section.
  -P, --postfile <FILE_PATH>  A path of a postfix file.  The file will be
                              concatinated after generated contents.
  -h, --help                  Print this text.
  -v, --verbose               Print detail messages in process.
  -V, --version               Print version number.
  -w, --watch                 Watching target files and directories.
                              Regenerates the manifest when those files are
                              added, removed, or changed.
  --network-star              Add "NETWORK:\n*" after generated contents.
```


## Examples

```
appcache-manifest "app/index.{html,css,js}" "app/lib/**/*.{css,js}" --network-star -o app/index.appcache --watch
```

```
appcache-manifest "app/**/*.{html,css,js}" -o app/index.appcache --postfile src/api.txt --postfile src/fallback.txt --watch
```


## Node.js API

```js
var am = require("appcache-manifest");
```

### am.generate(fileGlobs, options)

Generate a manifest file content; path list and a md5 hash comment.

- **fileGlobs** `string|string[]` -- Globs that includes into CACHE section of the manifest.
- **options** `object`
  - **options.prefix** `string` -- A prefix parts for each path of cache section.
  - **options.postfile** `string|string[]` -- Paths of a postfix file.
    The file will be concatinated after generated contents.
  - **options.networkStar** `boolean` -- Don't add the setting that allow all
    other path.  By default, "NETWORK: *" is added.

This function returns `streams.Readable`.
The stream outputs generated contents.
