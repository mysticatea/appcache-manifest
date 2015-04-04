# appcache-manifest

[![Build Status](https://travis-ci.org/mysticatea/appcache-manifest.svg?branch=master)](https://travis-ci.org/mysticatea/appcache-manifest)
[![npm version](https://badge.fury.io/js/appcache-manifest.svg)](http://badge.fury.io/js/appcache-manifest)

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

This tool has two command; `appcache-manifest` and `appcache-manifest-fixer`.

- `appcache-manifest` is a command to generate manifest files.
- `appcache-manifest-fixer` is a command to add a reference to a manifest file
  into HTML files.

```
Usage: appcache-manifest [OPTIONS] <FILES...>

  Generate manifest file from specified files.

  FILES: File globs that includes into manifest.

Options:
  -o, --output <FILE_PATH>    A path of the output file.  By default, write to
                              stdout.
  -p, --prefix <PATH>         A prefix parts for paths of cache section.
  -P, --postfile <FILE_PATH>  A path of a postfix file.  The file will be
                              concatinated after generated contents.
  -h, --help                  Print this text.
  -v, --verbose               Print detail messages in process. This option
                              should be used together with --output option.
  -V, --version               Print version number.
  -w, --watch                 Watching target files and directories.
                              Regenerates the manifest when those files are
                              added, removed, or changed.
  --network-star              Add "NETWORK:\n*" after generated contents.
```

```
Usage: appcache-manifest-fixer [OPTIONS] [FILE]

  Add the "manifest" attribute into <html> tag.

  FILE: The target HTML file path. By default, read from stdin.

Options:
  -o, --output <FILE_PATH>  A path of the output file.  By default, write to
                            stdout.
  -h, --help                Print this text.
  -m, --manifest <PATH>     A path of the manifest file. The path will be set to
                            the value of the "manifest" attribute. By default,
                            "index.appcache".
  -v, --version             Print version number.
```


## Examples

```
appcache-manifest "app/index.{html,css,js}" "app/lib/**/*.{css,js}" --network-star -o app/index.appcache
```

```
appcache-manifest "app/**/*.{html,css,js}" --postfile src/api.txt --postfile src/fallback.txt -o app/index.appcache
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
  - **options.networkStar** `boolean` -- A flag to add "NETWORK:\n*" after
    generated contents.

This function returns `stream.Readable`.
The stream outputs generated contents.

### am.createFixer(options)

Add a "manifest" attribute into `<html>` tag.

- **options** `object`
  - **options.manifest** `string` -- A path to a manifest file.  By default,
    `"index.appcache"`.

This function returns `stream.Transform`.
The stream detect `<html>` tag from inputs, and add a `manifest` attribute.
