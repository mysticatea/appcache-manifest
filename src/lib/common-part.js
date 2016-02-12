/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

import {resolve} from "path";
import globParent from "glob-parent";
import {assert, assertType} from "./util";

const BACK_SLASH = /\\/g;
const DRIVE_LETER_ONLY = /^[a-zA-Z]+:$/;
const DRIVE_LETER = /^[a-zA-Z]+:/;

function pathToArray(path) {
    return path.replace(BACK_SLASH, "/").split("/").filter(Boolean);
}

function globParentToArray(glob) {
    return pathToArray(resolve(globParent(glob)));
}

function findLastCommonIndex(xs, ys) {
    for (let i = Math.min(xs.length, ys.length) - 1; i >= 0; --i) {
        if (xs[i] === ys[i]) {
            return i;
        }
    }
    return -1;
}

function isDriveLeterOnly(path) {
    return DRIVE_LETER_ONLY.test(path);
}

function hasDriveLeter(path) {
    return DRIVE_LETER.test(path);
}

/**
 * Calculates the common ancestor's path of given globs.
 *
 * @param {string[]} globs - A list of globs to calculate.
 * @return {string|null} the common ancestor's path.
 * @private
 */
export default function commonPart(globs) {
    assert(globs.length > 0);
    assertType(globs[0], "globs[0]", "string");

    const commonParts = globParentToArray(globs[0]);
    for (let i = 1, end = globs.length; i < end; ++i) {
        assertType(globs[i], `globs[${i}]`, "string");

        const parts = globParentToArray(globs[i]);
        const index = findLastCommonIndex(commonParts, parts);
        if (index === -1) {
            return null;
        }

        // remove all after the index.
        commonParts.splice(1 + index);
    }

    const common = commonParts.join("/");
    if (isDriveLeterOnly(common)) {
        return null;
    }
    if (hasDriveLeter(common)) {
        return `${common}/`;
    }
    return `/${common}/`;
}
