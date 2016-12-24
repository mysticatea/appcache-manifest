/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("assert")

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = Object.assign(
    (condition, message) => {
        if (!condition) {
            throw new Error(message)
        }
    },
    assert,
    {
        boolean(value, name) {
            if (typeof value !== "boolean") {
                throw new TypeError(`"${name}" should be a boolean.`)
            }
        },

        function(value, name) {
            if (typeof value !== "function") {
                throw new TypeError(`"${name}" should be a function.`)
            }
        },

        string(value, name) {
            if (typeof value !== "string") {
                throw new TypeError(`"${name}" should be a string.`)
            }
        },

        booleanOpt(value, name) {
            if (value != null && typeof value !== "boolean") {
                throw new TypeError(`"${name}" should be a boolean or undefined.`)
            }
        },

        stringOpt(value, name) {
            if (value != null && typeof value !== "string") {
                throw new TypeError(`"${name}" should be a string or undefined.`)
            }
        },
    }
)
