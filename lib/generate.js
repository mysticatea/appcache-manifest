/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const crypto = require("crypto")
const fs = require("fs")
const path = require("path")
const stream = require("stream")
const createGlobStream = require("glob-stream")
const commonPart = require("./common-part")
const concat = require("./concat")
const constant = require("./constant")
const Queue = require("./queue")
const assert = require("./assert")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const PREFIX = Symbol("prefix")
const FILES = Symbol("files")
const STAMP = Symbol("stamp")
const APPCACHE_TRANSFORM_OPTIONS = {
    allowHalfOpen: false,
    decodeStrings: false,
    writableObjectMode: true,
}
const ALL_BACK_SLASH = /\\/g

/**
 * Converts a value to an array.
 *
 * @param {any} x - A value to convert.
 * @returns {any[]} Array.
 * @private
 */
function toArray(x) {
    if (x == null) {
        return []
    }
    return Array.isArray(x) ? x : [x]
}

/**
 * The transform stream which generates the content of a manifest file from a glob-stream.
 *
 * This stream has 2 aditional events.
 *
 * - "addpath" will be filed when a file is added. `{path: string}`.
 * - "addhash" will be filed when the fingerprint of files is generated. `{digest: string}`.
 *
 * @private
 */
class AppcacheTransform extends stream.Transform {
    /**
     * Initialize with the given options.
     *
     * @param {object} [options] - The option object to initialize.
     * @param {string} [options.prefix] - The additional prefix of paths.
     * @param {boolean} [options.stamp] - The flag to use time-stamp instead of md5 hash.
     */
    constructor(options) {
        super(APPCACHE_TRANSFORM_OPTIONS)
        assert.stringOpt(options && options.prefix, "options.prefix")
        assert.booleanOpt(options && options.stamp, "options.stamp")

        const prefix = options && options.prefix

        this[PREFIX] = prefix == null ? "/" : String(prefix)
        this[FILES] = []
        this[STAMP] = Boolean(options && options.stamp)

        this.push("CACHE MANIFEST\n")
    }

    /**
     * The additional prefix of paths.
     * @type {string}
     */
    get prefix() {
        return this[PREFIX]
    }

    /**
     * @inheritdoc
     */
    _transform(file, encoding, cb) {
        const rel = path.relative(file.base, file.path.replace(ALL_BACK_SLASH, "/"))
        this[FILES].push({
            file: file.path,
            path: path.join(this.prefix, rel).replace(ALL_BACK_SLASH, "/"),
        })
        cb()
    }

    /**
     * @inheritdoc
     */
    _flush(cb) {
        // Sort by URL path.
        // readdir() doesn't guarantee order of files, but we needs it for md5.
        const files = this[FILES]
        files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? +1 : 0)

        // Process files on sequential.
        const queue = new Queue()
        const md5 = crypto.createHash("md5")
        files.forEach(item => {
            queue.push(next => {
                this.push(`${item.path}\n`)
                this.emit("addpath", {path: item.path})

                fs.createReadStream(item.file)
                    .on("data", (data) => {
                        md5.update(data)
                    })
                    .on("end", next)
                    .on("error", (err) => {
                        next()
                        this.emit("error", err)
                    })
            })
        })

        // Dump fingerprint.
        queue.push(next => {
            const digest = md5.digest("hex")

            if (this[STAMP]) {
                this.push(`# Created at ${new Date().toISOString()}\n`)
            }
            else {
                this.push(`#${digest}\n`)
            }

            this.emit("addhash", {digest})
            cb()
            next()
        })
    }
}

/**
 * Create the stream to generate the cache section of appcache manifest.
 *
 * @param {string|string[]} globOrGlobArray - The glob patterns to spcify the files of the cache section.
 * @param {object} options - The option object.
 * @returns {AppcacheTransform} The created stream.
 * @private
 */
function generateContent(globOrGlobArray, options) {
    // Detect base.
    const globs = toArray(globOrGlobArray)
    assert(globs.length > 0, "globs should exist")

    const base = commonPart(globs)
    assert(base != null, "the common parent directory of globs is not found.")

    // Create streams.
    const globStream = createGlobStream(globs, {base})
    const appcacheStream = globStream.pipe(new AppcacheTransform(options))

    globStream.on("error", (err) => appcacheStream.emit("error", err))

    return appcacheStream
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Creates a stream which generates an appcache manifest.
 *
 * @param {string|string[]} globOrGlobArray - A glob or a list of globs to specify files the manifest includes.
 * @param {object|null} options - An option object or null.
 * @param {string|null} options.prefix - The prefix of paths the manifest includes.
 * @param {string|string[]|null} options.postfile - A file path or a list of file paths which are added to the tail of the manifest.
 * @param {boolean|null} options.stamp - The flag which indicates adding the date/time instead of an md5 hash
 * @param {boolean|null} options.networkStar - The flag which indicates adding `NETWORK:\n*` section.
 * @returns {streams.Readable} Created stream which generates an appcache manifest.
 */
module.exports = function generate(globOrGlobArray, options) {
    // Create streams for content.
    const streams = []
    streams.push(generateContent(globOrGlobArray, options))
    toArray(options && options.postfile).forEach(postfile => {
        streams.push(fs.createReadStream(postfile, {encoding: "utf8"}))
        streams.push(constant("\n"))
    })
    if (options && options.networkStar) {
        streams.push(constant("NETWORK:\n*\n"))
    }

    const concatStream = concat(streams)
    streams[0]
        .on("addpath", (e) => concatStream.emit("addpath", e))
        .on("addhash", (e) => concatStream.emit("addhash", e))

    return concatStream
}
