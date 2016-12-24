# appcache-manifest

[![npm version](https://img.shields.io/npm/v/appcache-manifest.svg)](https://www.npmjs.com/package/appcache-manifest)
[![Downloads/month](https://img.shields.io/npm/dm/appcache-manifest.svg)](http://www.npmtrends.com/appcache-manifest)
[![Build Status](https://travis-ci.org/mysticatea/appcache-manifest.svg?branch=master)](https://travis-ci.org/mysticatea/appcache-manifest)
[![Coverage Status](https://codecov.io/gh/mysticatea/appcache-manifest/branch/master/graph/badge.svg)](https://codecov.io/gh/mysticatea/appcache-manifest)
[![Dependency Status](https://david-dm.org/mysticatea/appcache-manifest.svg)](https://david-dm.org/mysticatea/appcache-manifest)

A CLI tool to generate HTML5 Application Cache Manifest.

- `appcache-manifest` command generates the manifest file of given files.
    - The manifest file includes the `md5` hash which is calculated from the content of the files.
    - You can regenerate the manifest file when the files are changed by `--watch` option.

## :cd: Installation

```bash
$ npm install appcache-manifest
```

- Requires Node.js 4 or later.

## :book: Usage

This provides 2 commands; `appcache-manifest` and `appcache-manifest-fixer`.

- `appcache-manifest` is the command to generate manifest files.
- `appcache-manifest-fixer` is the command to add `manifest` attribute into a HTML file.

```
Usage: appcache-manifest [OPTIONS] [FILES...]

    FILES: File globs that includes into manifest.

Options:
    -o, --output <FILE_PATH>    The path of an output file.
                                Prints to stdout by default.
    -p, --prefix <PATH>         The prefix part of each path in cache section.
    -P, --postfile <FILE_PATH>  The path of a postfix file.  The file will be
                                concatinated after generated contents.
    -h, --help                  Prints this text.
    -v, --verbose               Prints detail messages in progress. This option
                                must be used together with '--output' option.
    -V, --version               Prints version number.
    -w, --watch                 This command would be watching target files and
                                directories if --watch option is specified.
                                Then it regenerates the manifest file when those
                                files are added, removed, or changed.
    --network-star              Adds "NETWORK:\n*" after generated contents.
    --stamp                     Stamps the output with the date/time instead
                                of an md5 hash.
```

```
Usage: appcache-manifest-fixer [FILE_PATH] [OPTIONS]

    This command would add "manifest" attribute into <html> tag.

    FILE_PATH: The target HTML file path.
               Reading from stdin by default

Options:
    -o, --output <FILE_PATH>  The path of an output file.
                              Writing to stdout by default.
    -h, --help                Prints this text.
    -m, --manifest <PATH>     The path of a manifest file. The path will be set
                              to the value of "manifest" attribute.
                              "index.appcache" by default.
    -v, --version             Prints version number.
```


### Examples

```
appcache-manifest "app/index.{html,css,js}" "app/lib/**/*.{css,js}" --network-star -o app/index.appcache
```

```
appcache-manifest "app/**/*.{html,css,js}" --postfile src/api.txt --postfile src/fallback.txt -o app/index.appcache
```


## :turtle: Node.js API

```js
var am = require("appcache-manifest");
```

### am.generate(fileGlobs, options)

Generate a manifest file content; path list and a md5 hash comment.

- **fileGlobs** `string|string[]` -- Globs that includes into CACHE section of the manifest.
- **options** `object`
  - **options.prefix** `string` -- The prefix part of each path in cache section.
  - **options.postfile** `string|string[]` -- Paths of a postfix file. The file will be concatinated after generated contents.
  - **options.networkStar** `boolean` -- A flag to add "NETWORK:\n*" after generated contents.
  - **options.stamp** `boolean` -- Stamps the output with the date/time instead
  of an md5 hash.

This function returns `stream.Readable`.
The stream outputs generated contents.

### am.createFixer(options)

Add a "manifest" attribute into `<html>` tag.

- **options** `object`
  - **options.manifest** `string` -- A path to a manifest file.  By default,
    `"index.appcache"`.

This function returns `stream.Transform`.
The stream detect `<html>` tag from inputs, and add a `manifest` attribute.

## :newspaper: Changelog

- [GitHub Releases](https://github.com/mysticatea/appcache-manifest/releases)

## :muscle: Contributing

Welcome contributing!

Please use GitHub's Issues/PRs.

### Development Tools

- `npm test` runs tests and measures coverage.
- `npm run coverage` shows the coverage result of `npm test` command with the default browser.
- `npm run clean` removes the coverage result of `npm test` command.
- `npm run lint` runs ESLint.
- `npm run watch` runs tests with `--watch` option.
