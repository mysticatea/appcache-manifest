/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import {Readable} from "stream";
import {assertType} from "./util";

const VALUE = Symbol("value");

class ConstantStream extends Readable {
    constructor(value) {
        super({
            highWaterMark: Buffer.byteLength(value),
            encoding: "utf8"
        });
        this[VALUE] = value;
    }

    _read() {
        this.push(this[VALUE]);
        this.push(null);
    }
}

/**
 * Creates the stream which has a constant value.
 *
 * @param {string} value - A value.
 * @returns {stream.Readable} A readable stream of the value.
 * @private
 */
export default function constant(value) {
    assertType(value, "value", "string");
    return new ConstantStream(value);
}
