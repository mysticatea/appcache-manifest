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

  -b, --base <PATH>           A path of base directory for cache files.
                              Generated paths becomes relative paths from it.
                              By default, the common directory of file globs.
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
  --no-network-star           Don't add the setting that allow all other path.
                              By default, "NETWORK: *" is added.
```

## Examples

```
appcache-manifest app/index.{html,css,js} app/lib/**/*.{css,js} -o app/index.appcache
```

```
appcache-manifest app/**/*.{html,css,js,png} -o app/index.appcache --postfile src/api.txt --postfile src/fallback.txt --no-network-star
```

## Node.js API

```ts
var am = require("appcache-manifest");

am.generate(fileGlobs: string|string[], options?: object): streams.Readable
```

Generate a manifest file content -- path list and a md5 hash comment.
Not includs "NETWORK: *".

- `options.base` `{string}` -- A path of base directory for cache files.
  Generated paths becomes relative paths from it.
  By default, the common directory of file globs.
- `options.prefix` `{string}` -- A prefix parts for each path of cache section.
- `options.postfile` `{string|string[]}` -- A path of a postfix file.
  The file will be concatinated after generated contents.
- `options.noNetworkStar` `{boolean}` -- Don't add the setting that allow all
  other path.  By default, "NETWORK: *" is added.
