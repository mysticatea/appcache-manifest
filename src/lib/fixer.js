/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const stream = require("stream")
const {assertTypeOpt} = require("./util")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const MANIFEST = Symbol("manifest")
const BUFFER = Symbol("buffer")
const HTML_TAG_FOUND = Symbol("html-tag-found")
const HTML_PATTERN = /(<html)(\s|>)/i

/**
 * The transform stream to add manifest attribute to `<html>` tags.
 *
 * @private
 */
class Fixer extends stream.Transform {
    /**
     * Initialize with the given options.
     *
     * @param {object} [options] - The option object to initialize.
     * @param {string} [options.manifest="index.appcache"] - The path to the manifest file.
     */
    constructor(options) {
        assertTypeOpt(options && options.manifest, "options.manifest", "string")
        super()

        this[MANIFEST] = (options && options.manifest) || "index.appcache"
        this[BUFFER] = ""
        this[HTML_TAG_FOUND] = false
    }

    /**
     * @inheritdoc
     */
    _transform(chunk, encoding, callback) {
        if (this[HTML_TAG_FOUND]) {
            this.push(chunk)
        }
        else {
            this[BUFFER] += chunk.toString()
            this[BUFFER] = this[BUFFER].replace(HTML_PATTERN, (_, pre, post) => {
                this[HTML_TAG_FOUND] = true
                return `${pre} manifest="${this[MANIFEST]}"${post}`
            })

            if (this[HTML_TAG_FOUND]) {
                this.push(this[BUFFER])
                this[BUFFER] = null
            }
        }
        callback()
    }

    /**
     * @inheritdoc
     */
    _flush(callback) {
        if (this[BUFFER] != null) {
            this.push(this[BUFFER])
        }
        callback()
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Create the transform stream to add manifest attribute to `<html>` tags.
 *
 * @param {object} [options] - The option object to initialize.
 * @param {string} [options.manifest="index.appcache"] - The path to the manifest file.
 * @returns {stream.Transform} The created transform stream.
 * @private
 */
module.exports = function createFixer(options) {
    return new Fixer(options)
}
