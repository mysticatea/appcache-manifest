"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

exports.assert = assert;
exports.assertType = assertType;
exports.assertTypeOpt = assertTypeOpt;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertType(value, name, type) {
    if ((typeof value === "undefined" ? "undefined" : (0, _typeof3.default)(value)) !== type) {
        throw new TypeError(name + " should be a " + type + ".");
    }
}

function assertTypeOpt(value, name, type) {
    if (value != null && (typeof value === "undefined" ? "undefined" : (0, _typeof3.default)(value)) !== type) {
        throw new TypeError(name + " should be a " + type + " or null.");
    }
}