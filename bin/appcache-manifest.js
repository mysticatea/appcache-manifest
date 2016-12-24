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
const chokidar = require("chokidar")
const minimist = require("minimist")
const mkdir = require("mkdirp")
const createAppcacheStream = require("../lib/generate")
const Queue = require("../lib/queue")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const OPTIONS = [
  {name: "output", alias: "o", type: "string"},
  {name: "prefix", alias: "p", type: "string"},
  {name: "postfile", alias: "P", type: "string"},
  {name: "help", alias: "h", type: "boolean"},
  {name: "verbose", alias: "v", type: "boolean"},
  {name: "version", alias: "V", type: "boolean"},
  {name: "watch", alias: "w", type: "boolean"},
  {name: "network-star", alias: "networkStar", type: "boolean"},
  {name: "stamp", alias: "s", type: "boolean"},
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
Usage: appcache-manifest [OPTIONS] [FILES...]

    FILES: File globs that includes into manifest.

Options:
    -o, --output <FILE_PATH>    The path of an output file.
                                Prints to stdout by default.
    -s, --stamp                 Stamps the output with the date/time instead
                                of an md5 hash.
    -p, --prefix <PATH>         The prefix part of paths in cache section.
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

//------------------------------------------------------------------------------
const generationQueue = new Queue()

/**
 * Generate appcache manifest.
 *
 * @param {string[]} globs - The globs which specifies the target files.
 * @param {object} options - The option object.
 * @param {function} callback - The callback function.
 * @returns {void}
 * @private
 */
function generate(globs, options, callback) {
    if (generationQueue.size > 0) {
        // There is a process not started.
        return
    }
    if (typeof options.delay === "number") {
        generationQueue.push(next => setTimeout(next, options.delay))
    }
    generationQueue.push(next => {
        //eslint-disable-next-line require-jsdoc
        function done(err) {
            if (err != null) {
                process.exitCode = 1
                console.error(`  ERROR: ${err.message}`)
            }
            if (options.verbose && err == null) {
                console.log("  Done.")
            }

            next()

            if (callback != null) {
                callback(err)
            }
        }

        const appcacheStream = createAppcacheStream(globs, options)
        if (options.verbose) {
            console.log(`Generate: ${options.output}`)
            appcacheStream
                .on("addpath", (e) => console.log(`  Add: ${e.path}`))
                .on("addhash", (e) => console.log(`  Add fingerprint: ${e.digest}`))
        }

        // Pipe to output.
        if (options.output) {
            const dir = path.dirname(path.resolve(options.output))
            mkdir(dir, (err) => {
                if (err != null) {
                    done(err)
                }
                else {
                    appcacheStream
                        .pipe(fs.createWriteStream(options.output))
                        .on("finish", done)
                        .on("error", done)
                }
            })
        }
        else {
            appcacheStream
                .on("end", done)
                .pipe(process.stdout)
        }
    })
}

/**
 * Generate appcache manifest for each change.
 *
 * @param {string[]} globs - The globs which specifies the target files.
 * @param {object} options - The option object.
 * @returns {void}
 * @private
 */
function watch(globs, options) {
    options.delay = 1000

    chokidar
        .watch(globs, {persistent: true, ignoreInitial: true})
        .on("add", () => generate(globs, options))
        .on("unlink", () => generate(globs, options))
        .on("change", () => generate(globs, options))
        .on("error", (err) => console.error(`ERROR: ${err.message}`))
        .on("ready", () => {
            if (options.verbose) {
                console.log(`Be watching ${globs.join(", ")}`)
            }
        })

    // In order to kill by the test harness.
    process.on("message", () => {
        process.exit(0)
    })
}

/**
 * Validate options.
 *
 * @param {string[]} globs - The globs which specifies the target files.
 * @param {object} options - The option object.
 * @returns {boolean} `true` if the option object is valid.
 * @private
 */
function validate(globs, options) {
    let hasError = false

    if (globs == null || globs.length === 0) {
        console.error("ERROR: requires file globs.")
        hasError = true
    }
    if (options.output != null && Array.isArray(options.output)) {
        console.error("ERROR: --output option should not be multiple.")
        hasError = true
    }
    if (options.prefix != null) {
        if (Array.isArray(options.prefix)) {
            console.error("ERROR: --prefix option should not be multiple.")
            hasError = true
        }
        else if (options.prefix[0] !== "/") {
            console.error("ERROR: --prefix option should be started with '/'.")
            hasError = true
        }
    }
    if (options.verbose && !options.output) {
        console.error("ERROR: --verbose option should be used together with --output option.")
        hasError = true
    }
    if (options.watch && !options.output) {
        console.error("ERROR: --watch option should be used together with --output option.")
        hasError = true
    }

    return !hasError
}

//------------------------------------------------------------------------------
// Main
//------------------------------------------------------------------------------

// Parse arguments.
let hasUnknownOptions = false
const args = process.argv.slice(2)
const options = minimist(args, {
    string: OPTIONS.filter(o => o.type === "string").map(o => o.name),
    boolean: OPTIONS.filter(o => o.type === "boolean").map(o => o.name),
    alias: OPTIONS.filter(o => o.alias != null).reduce(mergeAlias, {}),
    unknown: (arg) => {
        if (arg[0] === "-") {
            console.error(`ERROR: ${arg} is unknown option.`)
            hasUnknownOptions = true
        }
    },
})
const globs = options._

// Help/Version.
if (options.help || args.length === 0) {
    printHelp()
    return
}
if (options.version || (args.length === 1 && args[0] === "-v")) {
    printVersion()
    return
}

// Validate.
if (!validate(globs, options) || hasUnknownOptions) {
    process.exitCode = 1
    return
}

// Main.
generate(globs, options, (err) => {
    if (options.watch && err == null) {
        watch(globs, options)
    }
})
