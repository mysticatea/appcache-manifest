/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

const {createHash} = require("crypto");
const {createReadStream} = require("fs");
const {join, relative} = require("path");
const {Transform} = require("stream");
const {create: createGlobStream} = require("glob-stream");
const commonPart = require("./common-part");
const concat = require("./concat");
const constant = require("./constant");
const Queue = require("./queue");
const {assert, assertTypeOpt} = require("./util");

const PREFIX = Symbol("prefix");
const FILES = Symbol("files");
const STAMP = Symbol("stamp");
const APPCACHE_TRANSFORM_OPTIONS = {
    allowHalfOpen: false,
    decodeStrings: false,
    writableObjectMode: true
};
const ALL_BACK_SLASH = /\\/g;

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
class AppcacheTransform extends Transform {
    constructor(options) {
        super(APPCACHE_TRANSFORM_OPTIONS);
        assertTypeOpt(options && options.prefix, "options.prefix", "string");

        this[PREFIX] = (options && options.prefix) || "/";
        this[FILES] = [];
        this[STAMP] = (options && options.stamp) || false;

        assert(this[PREFIX][0] === "/", "options.prefix should be started with '/'.");

        this.push("CACHE MANIFEST\n");
    }

    get prefix() {
        return this[PREFIX];
    }

    _transform(file, encoding, cb) {
        const rel = relative(file.base, file.path.replace(ALL_BACK_SLASH, "/"));
        this[FILES].push({
            file: file.path,
            path: join(this.prefix, rel).replace(ALL_BACK_SLASH, "/")
        });
        cb();
    }

    _flush(cb) {
        // Sort by URL path.
        // readdir() doesn't guarantee order of files, but we needs it for md5.
        const files = this[FILES];
        files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? +1 : 0);

        // Process files on sequential.
        const queue = new Queue();
        const md5 = createHash("md5");
        files.forEach(item => {
            queue.push(next => {
                this.push(`${item.path}\n`);
                this.emit("addpath", {path: item.path});

                createReadStream(item.file)
            .on("data", (data) => { md5.update(data); })
            .on("end", next)
            .on("error", (err) => { next(); this.emit("error", err); });
            });
        });

        // Dump fingerpoint.
        queue.push(next => {
            const digest = md5.digest("hex");

            if (this[STAMP]) {
                this.push(`# Created at ${new Date().toISOString()}\n`);
            }
            else {
                this.push(`#${digest}\n`);
            }

            this.emit("addhash", {digest});
            cb();
            next();
        });
    }
}

function generateContent(globOrGlobArray, options) {
    // Detect base.
    const globs = toArray(globOrGlobArray);
    assert(globs.length > 0, "globs should exist");

    const base = commonPart(globs);
    assert(base != null, "the common parent directory of globs is not found.");

    // Create streams.
    const globStream = createGlobStream(globs, {base});
    const appcacheStream = globStream.pipe(new AppcacheTransform(options));

    globStream.on("error", (err) => appcacheStream.emit("error", err));

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
module.exports = function generate(globOrGlobArray, options) {
    // Create streams for content.
    const streams = [];
    streams.push(generateContent(globOrGlobArray, options));
    toArray(options && options.postfile).forEach(path => {
        streams.push(createReadStream(path, {encoding: "utf8"}));
        streams.push(constant("\n"));
    });
    if (options && options.networkStar) {
        streams.push(constant("NETWORK:\n*\n"));
    }

    const concatStream = concat(streams);
    streams[0]
        .on("addpath", (e) => concatStream.emit("addpath", e))
        .on("addhash", (e) => concatStream.emit("addhash", e));

    return concatStream;
};
