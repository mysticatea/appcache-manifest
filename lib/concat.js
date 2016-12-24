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
const assert = require("./assert")
const Queue = require("./queue")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const QUEUE = Symbol("queue")
const CONCAT_TRANSFORM_OPTIONS = {allowHalfOpen: false}

/**
 * The stream to concatenate the given streams.
 *
 * @private
 */
class ConcatStream extends stream.PassThrough {
    /**
     * Initialize.
     */
    constructor() {
        super(CONCAT_TRANSFORM_OPTIONS)
        this[QUEUE] = new Queue()
    }

    /**
     * Add a stream to concatenate.
     *
     * @param {stream.Readable} source - The stream to be concatenated.
     * @param {boolean} end - The flag to indicate the end of this stream.
     * @returns {void}
     */
    addSource(source, end) {
        assert(this[QUEUE] != null, "InvalidStateError")
        assert.boolean(end, "end")

        this[QUEUE].push(next => {
            source.pipe(this, {end})
            source.on("end", next)
            source.on("error", (err) => {
                this.emit("error", err)
                next()
            })
        })

        if (end) {
            this[QUEUE] = null
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Concatenates given readable streams.
 *
 * @param {stream.Readable} sources - A list of readable streams to concatenate.
 * @returns {stream.Readable} The concatenated stream.
 * @private
 */
module.exports = function concat(sources) {
    const concatStream = new ConcatStream()
    const lastIndex = sources.length - 1

    sources.forEach((source, index) => {
        concatStream.addSource(source, index === lastIndex)
    })

    return concatStream
}
