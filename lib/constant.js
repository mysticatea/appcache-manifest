/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const Buffer = require("buffer").Buffer
const stream = require("stream")
const {assertType} = require("./util")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const VALUE = Symbol("value")

/**
 * The readable stream to emit a constant value.
 *
 * @private
 */
class ConstantStream extends stream.Readable {
    /**
     * Initialize this stream with the given value.
     *
     * @param {string} value - The constant value.
     */
    constructor(value) {
        super({
            highWaterMark: Buffer.byteLength(value),
            encoding: "utf8",
        })
        this[VALUE] = value
    }

    /**
     * @inheritdoc
     */
    _read() {
        this.push(this[VALUE])
        this.push(null)
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Creates the stream which has a constant value.
 *
 * @param {string} value - A value.
 * @returns {stream.Readable} A readable stream of the value.
 * @private
 */
module.exports = function constant(value) {
    assertType(value, "value", "string")
    return new ConstantStream(value)
}
