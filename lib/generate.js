"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _symbol = require("babel-runtime/core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

exports.default = generate;

var _crypto = require("crypto");

var _fs = require("fs");

var _path = require("path");

var _stream = require("stream");

var _globStream = require("glob-stream");

var _commonPart = require("./common-part");

var _commonPart2 = _interopRequireDefault(_commonPart);

var _concat = require("./concat");

var _concat2 = _interopRequireDefault(_concat);

var _constant = require("./constant");

var _constant2 = _interopRequireDefault(_constant);

var _queue = require("./queue");

var _queue2 = _interopRequireDefault(_queue);

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

var PREFIX = (0, _symbol2.default)("prefix");
var FILES = (0, _symbol2.default)("files");
var STAMP = (0, _symbol2.default)("stamp");
var APPCACHE_TRANSFORM_OPTIONS = {
    allowHalfOpen: false,
    decodeStrings: false,
    writableObjectMode: true
};
var ALL_BACK_SLASH = /\\/g;

/**
 * Converts a value to an array.
 *
 * @param {any} x - A value to convert.
 * @returns {any[]} Array.
 */
function toArray(x) {
    if (x == null) {
        return [];
    }
    return Array.isArray(x) ? x : [x];
}

/**
 * Transform stream from glob-stream to manifest file content (string).
 * This has two aditional event.
 *   - "addpath" will be filed added path. `{path: string}`.
 *   - "addhash" will be filed added fingerpoint of paths. `{digest: string}`.
 */

var AppcacheTransform = function (_Transform) {
    (0, _inherits3.default)(AppcacheTransform, _Transform);

    function AppcacheTransform(options) {
        (0, _classCallCheck3.default)(this, AppcacheTransform);

        var _this = (0, _possibleConstructorReturn3.default)(this, (AppcacheTransform.__proto__ || (0, _getPrototypeOf2.default)(AppcacheTransform)).call(this, APPCACHE_TRANSFORM_OPTIONS));

        (0, _util.assertTypeOpt)(options && options.prefix, "options.prefix", "string");

        _this[PREFIX] = options && options.prefix || "/";
        _this[FILES] = [];
        _this[STAMP] = options && options.stamp || false;

        (0, _util.assert)(_this[PREFIX][0] === "/", "options.prefix should be started with '/'.");

        _this.push("CACHE MANIFEST\n");
        return _this;
    }

    (0, _createClass3.default)(AppcacheTransform, [{
        key: "_transform",
        value: function _transform(file, encoding, cb) {
            var rel = (0, _path.relative)(file.base, file.path.replace(ALL_BACK_SLASH, "/"));
            this[FILES].push({
                file: file.path,
                path: (0, _path.join)(this.prefix, rel).replace(ALL_BACK_SLASH, "/")
            });
            cb();
        }
    }, {
        key: "_flush",
        value: function _flush(cb) {
            var _this2 = this;

            // Sort by URL path.
            // readdir() doesn't guarantee order of files, but we needs it for md5.
            var files = this[FILES];
            files.sort(function (a, b) {
                return a.path < b.path ? -1 : a.path > b.path ? +1 : 0;
            });

            // Process files on sequential.
            var queue = new _queue2.default();
            var md5 = (0, _crypto.createHash)("md5");
            files.forEach(function (item) {
                queue.push(function (next) {
                    _this2.push(item.path + "\n");
                    _this2.emit("addpath", { path: item.path });

                    (0, _fs.createReadStream)(item.file).on("data", function (data) {
                        md5.update(data);
                    }).on("end", next).on("error", function (err) {
                        next();_this2.emit("error", err);
                    });
                });
            });

            // Dump fingerpoint.
            queue.push(function (next) {
                var digest = md5.digest("hex");

                if (_this2[STAMP]) {
                    _this2.push("# Created at " + new Date().toISOString() + "\n");
                } else {
                    _this2.push("#" + digest + "\n");
                }

                _this2.emit("addhash", { digest: digest });
                cb();
                next();
            });
        }
    }, {
        key: "prefix",
        get: function get() {
            return this[PREFIX];
        }
    }]);
    return AppcacheTransform;
}(_stream.Transform);

function generateContent(globOrGlobArray, options) {
    // Detect base.
    var globs = toArray(globOrGlobArray);
    (0, _util.assert)(globs.length > 0, "globs should exist");

    var base = (0, _commonPart2.default)(globs);
    (0, _util.assert)(base != null, "the common parent directory of globs is not found.");

    // Create streams.
    var globStream = (0, _globStream.create)(globs, { base: base });
    var appcacheStream = globStream.pipe(new AppcacheTransform(options));

    globStream.on("error", function (err) {
        return appcacheStream.emit("error", err);
    });

    return appcacheStream;
}

/**
 * Creates a stream which generates an appcache manifest.
 *
 * @param {string|string[]} globOrGlobArray - A glob or a list of globs to specify files the manifest includes.
 * @param {object|null} options - An option object or null.
 * @param {string|null} options.prefix - The prefix of paths the manifest includes.
 * @param {string|string[]|null} options.postfile - A file path or a list of file paths which are added to the tail of the manifest.
 * @param {boolean|null} options.stamp - The flag which indicates adding the date/time instead of an md5 hash
 * @param {boolean|null} options.networkStar - The flag which indicates adding `NETWORK:\n*` section.
 * @return {streams.Readable} Created stream which generates an appcache manifest.
 */
function generate(globOrGlobArray, options) {
    // Create streams for content.
    var streams = [];
    streams.push(generateContent(globOrGlobArray, options));
    toArray(options && options.postfile).forEach(function (path) {
        streams.push((0, _fs.createReadStream)(path, { encoding: "utf8" }));
        streams.push((0, _constant2.default)("\n"));
    });
    if (options && options.networkStar) {
        streams.push((0, _constant2.default)("NETWORK:\n*\n"));
    }

    var concatStream = (0, _concat2.default)(streams);
    streams[0].on("addpath", function (e) {
        return concatStream.emit("addpath", e);
    }).on("addhash", function (e) {
        return concatStream.emit("addhash", e);
    });

    return concatStream;
}