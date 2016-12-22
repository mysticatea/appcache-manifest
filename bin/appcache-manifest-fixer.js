#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = main;

var _fs = require("fs");

var _path = require("path");

var _minimist = require("minimist");

var _minimist2 = _interopRequireDefault(_minimist);

var _mkdirp = require("mkdirp");

var _fixer = require("../lib/fixer");

var _fixer2 = _interopRequireDefault(_fixer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var OPTIONS = [{ name: "output", alias: "o", type: "string" }, { name: "help", alias: "h", type: "boolean" }, { name: "manifest", alias: "m", type: "string" }, { name: "version", alias: "v", type: "boolean" }];

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
    console.log("\nUsage: appcache-manifest-fixer [FILE_PATH] [OPTIONS]\n\n    This command would add \"manifest\" attribute into <html> tag.\n\n    FILE_PATH: The target HTML file path.\n               Reading from stdin by default\n\nOptions:\n    -o, --output <FILE_PATH>  The path of an output file.\n                              Writing to stdout by default.\n    -h, --help                Prints this text.\n    -m, --manifest <PATH>     The path of a manifest file. The path will be set\n                              to the value of \"manifest\" attribute.\n                              \"index.appcache\" by default.\n    -v, --version             Prints version number.\n\nSee Also:\n    https://github.com/mysticatea/appcache-manifest\n");
}

//------------------------------------------------------------------------------
function printVersion() {
    console.log("v" + require("../package.json").version); // eslint-disable-line
}

//------------------------------------------------------------------------------
function validate(globs, options) {
    var hasError = false;

    if (globs.length >= 2) {
        console.error("ERROR: the input file should not be multiple.");
        hasError = true;
    }
    if (options.output != null && Array.isArray(options.output)) {
        console.error("ERROR: --output option should not be multiple.");
        hasError = true;
    }
    if (options.manifest != null && Array.isArray(options.manifest)) {
        console.error("ERROR: --manifest option should not be multiple.");
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
    if (options.help) {
        printHelp();
        process.nextTick(function () {
            return callback(null);
        });
    }
    if (options.version) {
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
    if (options.output) {
        (0, _mkdirp.sync)((0, _path.dirname)((0, _path.resolve)(options.output)));
    }
    var input = globs[0] ? (0, _fs.createReadStream)(globs[0], { encoding: "utf8" }) :
    /* else */process.stdin;
    var output = options.output ? (0, _fs.createWriteStream)(options.output) :
    /* else */process.stdout;

    input.pipe((0, _fixer2.default)(options)).pipe(output);

    input.on("error", callback);
    output.on("error", callback);
    output.on("finish", function () {
        return callback(null);
    });
}

//------------------------------------------------------------------------------
if (require.main === module) {
    main(process.argv.slice(2), function (err) {
        return process.exit(err ? 1 : 0);
    });
}