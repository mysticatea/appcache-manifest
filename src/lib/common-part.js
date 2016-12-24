/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const path = require("path")
const globParent = require("glob-parent")
const util = require("./util")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const BACK_SLASH = /\\/g
const DRIVE_LETER_ONLY = /^[a-zA-Z]+:$/
const DRIVE_LETER = /^[a-zA-Z]+:/

/**
 * Get the parent path of the given glob as an array of path elements.
 *
 * @param {string} glob - The glob to get.
 * @returns {string[]} The path elements.
 * @private
 */
function globParentToArray(glob) {
    return path.resolve(globParent(glob))
        .replace(BACK_SLASH, "/")
        .split("/")
        .filter(Boolean)
}

/**
 * Get the index of the last element which is same between the given 2 elements.
 *
 * @param {string[]} xs - An array to compare.
 * @param {string[]} ys - Another array to compare.
 * @returns {number} The index of the last element is same.
 * @private
 */
function findLastCommonIndex(xs, ys) {
    for (let i = Math.min(xs.length, ys.length) - 1; i >= 0; --i) {
        if (xs[i] === ys[i]) {
            return i
        }
    }
    return -1
}

/**
 * Check whether the given path is an drive letter.
 *
 * @param {string} targetPath - The path to be checked.
 * @returns {boolean} `true` if the path is an drive letter.
 * @private
 */
function isDriveLeterOnly(targetPath) {
    return DRIVE_LETER_ONLY.test(targetPath)
}

/**
 * Check whether the given path starts with an drive letter.
 *
 * @param {string} targetPath - The path to be checked.
 * @returns {boolean} `true` if the path starts with an drive letter.
 * @private
 */
function hasDriveLeter(targetPath) {
    return DRIVE_LETER.test(targetPath)
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Calculates the common ancestor's path of given globs.
 *
 * @param {string[]} globs - A list of globs to calculate.
 * @returns {string|null} the common ancestor's path.
 * @private
 */
module.exports = function commonPart(globs) {
    util.assert(globs.length > 0)
    util.assertType(globs[0], "globs[0]", "string")

    const commonParts = globParentToArray(globs[0])
    for (let i = 1, end = globs.length; i < end; ++i) {
        util.assertType(globs[i], `globs[${i}]`, "string")

        const parts = globParentToArray(globs[i])
        const index = findLastCommonIndex(commonParts, parts)
        if (index === -1) {
            return null
        }

        // remove all after the index.
        commonParts.splice(1 + index)
    }

    const common = commonParts.join("/")
    if (isDriveLeterOnly(common)) {
        return null
    }
    if (hasDriveLeter(common)) {
        return `${common}/`
    }
    return `/${common}/`
}
