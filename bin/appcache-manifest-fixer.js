#!/usr/bin/env node

/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const fs = require("fs")
const path = require("path")
const minimist = require("minimist")
const mkdir = require("mkdirp").sync
const fixer = require("../lib/fixer")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const OPTIONS = [
  {name: "output", alias: "o", type: "string"},
  {name: "help", alias: "h", type: "boolean"},
  {name: "manifest", alias: "m", type: "string"},
  {name: "version", alias: "v", type: "boolean"},
]

/**
 * The reduce handler to make alias object.
 *
 * @param {object} obj - The alias object.
 * @param {{name: string, alias: string}} option - The option object.
 * @returns {object} `obj`.
 * @private
 */
function mergeAlias(obj, option) {
    obj[option.alias] = option.name
    return obj
}

/**
 * Print the help text of this CLI command.
 *
 * @returns {void}
 * @private
 */
function printHelp() {
    console.log(`
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

See Also:
    https://github.com/mysticatea/appcache-manifest
`)
}

/**
 * Print the version number of this CLI command.
 *
 * @returns {void}
 * @private
 */
function printVersion() {
    console.log(`v${require("../package.json").version}`)
}

/**
 * Validate options.
 *
 * @param {string[]} globs - The globs which specifies the target files.
 * @param {object} options - The option object.
 * @returns {void}
 * @private
 */
function validate(globs, options) {
    let hasError = false

    if (globs.length >= 2) {
        console.error("ERROR: the input file should not be multiple.")
        hasError = true
    }
    if (options.output != null && Array.isArray(options.output)) {
        console.error("ERROR: --output option should not be multiple.")
        hasError = true
    }
    if (options.manifest != null && Array.isArray(options.manifest)) {
        console.error("ERROR: --manifest option should not be multiple.")
        hasError = true
    }

    return !hasError
}

/**
 * Process an error.
 *
 * @param {Error} err - The error to be processed.
 * @returns {void}
 */
function onError(err) {
    process.exitCode = 1
    console.error(`ERROR: ${err.message}`)
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

// Parse arguments.
let hasUnknownOptions = false
const options = minimist(process.argv.slice(2), {
    string: OPTIONS.filter(o => o.type === "string").map(o => o.name),
    boolean: OPTIONS.filter(o => o.type === "boolean").map(o => o.name),
    alias: OPTIONS.filter(o => o.alias != null).reduce(mergeAlias, {}),
    unknown(arg) {
        if (arg[0] === "-") {
            console.error(`ERROR: ${arg} is unknown option.`)
            hasUnknownOptions = true
        }
    },
})
const globs = options._

// Help/Version.
if (options.help) {
    printHelp()
    return
}
if (options.version) {
    printVersion()
    return
}

// Validate.
if (!validate(globs, options) || hasUnknownOptions) {
    process.exitCode = 1
    return
}

// Main.
if (options.output) {
    mkdir(path.dirname(path.resolve(options.output)))
}
const input = globs[0] ? fs.createReadStream(globs[0], {encoding: "utf8"}) : process.stdin
const output = options.output ? fs.createWriteStream(options.output) : process.stdout

input.pipe(fixer(options)).pipe(output)

input.on("error", onError)
output.on("error", onError)
