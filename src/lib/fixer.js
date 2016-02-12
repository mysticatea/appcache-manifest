/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import {Transform} from "stream";
import {assertTypeOpt} from "./util";

const MANIFEST = Symbol("manifest");
const BUFFER = Symbol("buffer");
const HTML_TAG_FOUND = Symbol("html-tag-found");
const HTML_PATTERN = /(<html)(\s|>)/i;

class Fixer extends Transform {
    constructor(options) {
        assertTypeOpt(options && options.manifest, "options.manifest", "string");
        super();

        this[MANIFEST] = (options && options.manifest) || "index.appcache";
        this[BUFFER] = "";
        this[HTML_TAG_FOUND] = false;
    }

    _transform(chunk, encoding, callback) {
        if (this[HTML_TAG_FOUND]) {
            this.push(chunk);
        }
        else {
            this[BUFFER] += chunk.toString();
            this[BUFFER] = this[BUFFER].replace(HTML_PATTERN, (_, pre, post) => {
                this[HTML_TAG_FOUND] = true;
                return `${pre} manifest="${this[MANIFEST]}"${post}`;
            });

            if (this[HTML_TAG_FOUND]) {
                this.push(this[BUFFER]);
                this[BUFFER] = null;
            }
        }
        callback();
    }

    _flush(callback) {
        if (this[BUFFER] != null) {
            this.push(this[BUFFER]);
        }
        callback();
    }
}

export default function createFixer(options) {
    return new Fixer(options);
}
