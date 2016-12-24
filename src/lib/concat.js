/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

const {PassThrough} = require("stream");
const Queue = require("./queue");
const {assert, assertType} = require("./util");

const QUEUE = Symbol("queue");
const CONCAT_TRANSFORM_OPTIONS = {allowHalfOpen: false};

class ConcatStream extends PassThrough {
    constructor() {
        super(CONCAT_TRANSFORM_OPTIONS);
        this[QUEUE] = new Queue();
    }

    addSource(source, end) {
        assert(this[QUEUE] != null, "InvalidStateError");
        assertType(end, "end", "boolean");

        this[QUEUE].push(next => {
            source.pipe(this, {end});
            source.on("end", next);
            source.on("error", (err) => {
                this.emit("error", err);
                next();
            });
        });

        if (end) {
            this[QUEUE] = null;
        }
    }
}

/**
 * Concatinates given readable streams.
 *
 * @param {stream.Readable} sources - A list of readable streams to concatinate.
 * @returns {stream.Readable} The concatinated stream.
 * @private
 */
module.exports = function concat(sources) {
    const concatStream = new ConcatStream();
    const lastIndex = sources.length - 1;

    sources.forEach((source, index) => {
        concatStream.addSource(source, index === lastIndex);
    });

    return concatStream;
};
