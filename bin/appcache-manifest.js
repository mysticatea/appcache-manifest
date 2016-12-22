#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = main;

var _fs = require("fs");

var _path = require("path");

var _chokidar = require("chokidar");

var _chokidar2 = _interopRequireDefault(_chokidar);

var _minimist = require("minimist");

var _minimist2 = _interopRequireDefault(_minimist);

var _mkdirp = require("mkdirp");

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _generate = require("../lib/generate");

var _generate2 = _interopRequireDefault(_generate);

var _queue = require("../lib/queue");

var _queue2 = _interopRequireDefault(_queue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OPTIONS = [{ name: "output", alias: "o", type: "string" }, { name: "prefix", alias: "p", type: "string" }, { name: "postfile", alias: "P", type: "string" }, { name: "help", alias: "h", type: "boolean" }, { name: "verbose", alias: "v", type: "boolean" }, { name: "version", alias: "V", type: "boolean" }, { name: "watch", alias: "w", type: "boolean" }, { name: "network-star", alias: "networkStar", type: "boolean" }, { name: "stamp", alias: "s", type: "boolean" }];

//------------------------------------------------------------------------------


/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

function mergeAlias(obj, option) {
    obj[option.alias] = option.name;
    return obj;
}

//------------------------------------------------------------------------------
function printHelp() {
    console.log("\nUsage: appcache-manifest [OPTIONS] [FILES...]\n\n    FILES: File globs that includes into manifest.\n\nOptions:\n    -o, --output <FILE_PATH>    The path of an output file.\n                                Prints to stdout by default.\n    -s, --stamp                 Stamps the output with the date/time instead\n                                of an md5 hash.\n    -p, --prefix <PATH>         The prefix part of paths in cache section.\n    -P, --postfile <FILE_PATH>  The path of a postfix file.  The file will be\n                                concatinated after generated contents.\n    -h, --help                  Prints this text.\n    -v, --verbose               Prints detail messages in progress. This option\n                                must be used together with '--output' option.\n    -V, --version               Prints version number.\n    -w, --watch                 This command would be watching target files and\n                                directories if --watch option is specified.\n                                Then it regenerates the manifest file when those\n                                files are added, removed, or changed.\n    --network-star              Adds \"NETWORK:\n*\" after generated contents.\n\nSee Also:\n    https://github.com/mysticatea/appcache-manifest\n");
}

//------------------------------------------------------------------------------
function printVersion() {
    console.log("v" + require("../package.json").version); // eslint-disable-line
}

//------------------------------------------------------------------------------
var generationQueue = new _queue2.default();

function generate(globs, options, callback) {
    if (generationQueue.size > 0) {
        // There is a process not started.
        return;
    }
    if (typeof options.delay === "number") {
        generationQueue.push(function (next) {
            return setTimeout(next, options.delay);
        });
    }
    generationQueue.push(function (next) {
        function done(err) {
            if (err != null) {
                console.error("  ERROR: " + err.message);
            }
            if (options.verbose && err == null) {
                console.log("  Done.");
            }

            next();

            if (callback != null) {
                callback(err);
            }
        }

        var appcacheStream = (0, _generate2.default)(globs, options);
        if (options.verbose) {
            console.log("Generate: " + options.output);
            appcacheStream.on("addpath", function (e) {
                return console.log("  Add: " + e.path);
            }).on("addhash", function (e) {
                return console.log("  Add fingerpoint: " + e.digest);
            });
        }

        // Pipe to output.
        if (options.output) {
            var dir = (0, _path.dirname)((0, _path.resolve)(options.output));
            (0, _mkdirp2.default)(dir, function (err) {
                if (err != null) {
                    done(err);
                } else {
                    appcacheStream.pipe((0, _fs.createWriteStream)(options.output)).on("finish", done).on("error", done);
                }
            });
        } else {
            appcacheStream.on("end", done).pipe(process.stdout);
        }
    });
}

//------------------------------------------------------------------------------
function watch(globs, options) {
    options.delay = 1000;

    return _chokidar2.default.watch(globs, { persistent: true, ignoreInitial: true }).on("add", function () {
        return generate(globs, options);
    }).on("unlink", function () {
        return generate(globs, options);
    }).on("change", function () {
        return generate(globs, options);
    }).on("error", function (err) {
        return console.error("ERROR: " + err.message);
    }).on("ready", function () {
        if (options.verbose) {
            console.log("Be watching " + globs.join(", "));
        }
    });
}

//------------------------------------------------------------------------------
function validate(globs, options) {
    var hasError = false;

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
        } else if (options.prefix[0] !== "/") {
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
function main(args, callback) {
    // Parse arguments.
    var hasUnknownOptions = false;
    var options = (0, _minimist2.default)(args, {
        string: OPTIONS.filter(function (o) {
            return o.type === "string";
        }).map(function (o) {
            return o.name;
        }),
        boolean: OPTIONS.filter(function (o) {
            return o.type === "boolean";
        }).map(function (o) {
            return o.name;
        }),
        alias: OPTIONS.filter(function (o) {
            return o.alias != null;
        }).reduce(mergeAlias, {}),
        unknown: function unknown(arg) {
            if (arg[0] === "-") {
                console.error("ERROR: " + arg + " is unknown option.");
                hasUnknownOptions = true;
            }
        }
    });
    var globs = options._;

    // Help/Version.
    if (options.help || args.length === 0) {
        printHelp();
        process.nextTick(function () {
            return callback(null);
        });
    }
    if (options.version || args.length === 1 && args[0] === "-v") {
        printVersion();
        process.nextTick(function () {
            return callback(null);
        });
    }

    // Validate.
    if (!validate(globs, options) || hasUnknownOptions) {
        process.nextTick(function () {
            return callback(new Error("InvalidArguments"));
        });
    }

    // Main.
    if (!options.watch) {
        generate(globs, options, function (err) {
            return callback(err);
        });
        return { close: function close() {
                return undefined;
            } };
    }

    var watcher = null;
    var closeRequested = false;
    generate(globs, options, function (err) {
        if (err != null) {
            callback(err);
        } else if (closeRequested) {
            callback(null);
        } else {
            watcher = watch(globs, options);
        }
    });

    return { close: function close() {
            if (watcher != null) {
                watcher.close();
                watcher = null;
                callback(null);
            } else {
                closeRequested = true;
            }
        } };
}

//------------------------------------------------------------------------------
if (require.main === module) {
    (function () {
        var watcher = main(process.argv.slice(2), function (err) {
            return process.exit(err ? 1 : 0);
        });

        // In order to kill by the test harness.
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", function (chunk) {
            if (chunk === "KILL") {
                watcher.close();
            }
        });
    })();
}