#!/usr/bin/env node

/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import {createWriteStream} from "fs";
import {resolve, dirname} from "path";
import chokidar from "chokidar";
import minimist from "minimist";
import mkdir from "mkdirp";
import createAppcacheStream from "../lib/generate";
import Queue from "../lib/queue";

const OPTIONS = [
  {name: "output", alias: "o", type: "string"},
  {name: "prefix", alias: "p", type: "string"},
  {name: "postfile", alias: "P", type: "string"},
  {name: "help", alias: "h", type: "boolean"},
  {name: "verbose", alias: "v", type: "boolean"},
  {name: "version", alias: "V", type: "boolean"},
  {name: "watch", alias: "w", type: "boolean"},
  {name: "network-star", alias: "networkStar", type: "boolean"},
  {name: "stamp", alias: "s", type: "boolean"}
];

//------------------------------------------------------------------------------
function mergeAlias(obj, option) {
    obj[option.alias] = option.name;
    return obj;
}

//------------------------------------------------------------------------------
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
`);
}

//------------------------------------------------------------------------------
function printVersion() {
    console.log(`v${require("../package.json").version}`); // eslint-disable-line
}

//------------------------------------------------------------------------------
const generationQueue = new Queue();

function generate(globs, options, callback) {
    if (generationQueue.size > 0) {
    // There is a process not started.
        return;
    }
    if (typeof options.delay === "number") {
        generationQueue.push(next => setTimeout(next, options.delay));
    }
    generationQueue.push(next => {
        function done(err) {
            if (err != null) {
                console.error(`  ERROR: ${err.message}`);
            }
            if (options.verbose && err == null) {
                console.log("  Done.");
            }

            next();

            if (callback != null) {
                callback(err);
            }
        }

        const appcacheStream = createAppcacheStream(globs, options);
        if (options.verbose) {
            console.log(`Generate: ${options.output}`);
            appcacheStream
                .on("addpath", (e) => console.log(`  Add: ${e.path}`))
                .on("addhash", (e) => console.log(`  Add fingerpoint: ${e.digest}`));
        }

        // Pipe to output.
        if (options.output) {
            const dir = dirname(resolve(options.output));
            mkdir(dir, (err) => {
                if (err != null) {
                    done(err);
                }
                else {
                    appcacheStream
                        .pipe(createWriteStream(options.output))
                        .on("finish", done)
                        .on("error", done);
                }
            });
        }
        else {
            appcacheStream
                .on("end", done)
                .pipe(process.stdout);
        }
    });
}

//------------------------------------------------------------------------------
function watch(globs, options) {
    options.delay = 1000;

    return chokidar
        .watch(globs, {persistent: true, ignoreInitial: true})
        .on("add", () => generate(globs, options))
        .on("unlink", () => generate(globs, options))
        .on("change", () => generate(globs, options))
        .on("error", (err) => console.error(`ERROR: ${err.message}`))
        .on("ready", () => {
            if (options.verbose) {
                console.log(`Be watching ${globs.join(", ")}`);
            }
        });
}

//------------------------------------------------------------------------------
function validate(globs, options) {
    let hasError = false;

    if (globs == null || globs.length === 0) {
        console.error("ERROR: requires file globs.");
        hasError = true;
    }
    if (options.output != null && Array.isArray(options.output)) {
        console.error("ERROR: --output option should not be multiple.");
        hasError = true;
    }
    if (options.prefix != null) {
        if (Array.isArray(options.prefix)) {
            console.error("ERROR: --prefix option should not be multiple.");
            hasError = true;
        }
        else if (options.prefix[0] !== "/") {
            console.error("ERROR: --prefix option should be started with '/'.");
            hasError = true;
        }
    }
    if (options.verbose && !options.output) {
        console.error("ERROR: --verbose option should be used together with --output option.");
        hasError = true;
    }
    if (options.watch && !options.output) {
        console.error("ERROR: --watch option should be used together with --output option.");
        hasError = true;
    }

    return !hasError;
}

//------------------------------------------------------------------------------
export default function main(args, callback) {
    // Parse arguments.
    let hasUnknownOptions = false;
    const options = minimist(args, {
        string: OPTIONS.filter(o => o.type === "string").map(o => o.name),
        boolean: OPTIONS.filter(o => o.type === "boolean").map(o => o.name),
        alias: OPTIONS.filter(o => o.alias != null).reduce(mergeAlias, {}),
        unknown: (arg) => {
            if (arg[0] === "-") {
                console.error(`ERROR: ${arg} is unknown option.`);
                hasUnknownOptions = true;
            }
        }
    });
    const globs = options._;

    // Help/Version.
    if (options.help || args.length === 0) {
        printHelp();
        process.nextTick(() => callback(null));
    }
    if (options.version || args.length === 1 && args[0] === "-v") {
        printVersion();
        process.nextTick(() => callback(null));
    }

    // Validate.
    if (!validate(globs, options) || hasUnknownOptions) {
        process.nextTick(() => callback(new Error("InvalidArguments")));
    }

    // Main.
    if (!options.watch) {
        generate(globs, options, (err) => callback(err));
        return {close: () => undefined};
    }

    let watcher = null;
    let closeRequested = false;
    generate(globs, options, (err) => {
        if (err != null) {
            callback(err);
        }
        else if (closeRequested) {
            callback(null);
        }
        else {
            watcher = watch(globs, options);
        }
    });

    return {close: () => {
        if (watcher != null) {
            watcher.close();
            watcher = null;
            callback(null);
        }
        else {
            closeRequested = true;
        }
    }};
}

//------------------------------------------------------------------------------
if (require.main === module) {
    const watcher = main(
        process.argv.slice(2),
        (err) => process.exit(err ? 1 : 0)
    );

    // In order to kill by the test harness.
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
        if (chunk === "KILL") {
            watcher.close();
        }
    });
}
