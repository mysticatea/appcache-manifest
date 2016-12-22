"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = commonPart;

var _path = require("path");

var _globParent = require("glob-parent");

var _globParent2 = _interopRequireDefault(_globParent);

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BACK_SLASH = /\\/g; /**
                         * @author Toru Nagashima
                         * @copyright 2016 Toru Nagashima. All rights reserved.
                         * See LICENSE file in root directory for full license.
                         */

var DRIVE_LETER_ONLY = /^[a-zA-Z]+:$/;
var DRIVE_LETER = /^[a-zA-Z]+:/;

function pathToArray(path) {
    return path.replace(BACK_SLASH, "/").split("/").filter(Boolean);
}

function globParentToArray(glob) {
    return pathToArray((0, _path.resolve)((0, _globParent2.default)(glob)));
}

function findLastCommonIndex(xs, ys) {
    for (var i = Math.min(xs.length, ys.length) - 1; i >= 0; --i) {
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
function commonPart(globs) {
    (0, _util.assert)(globs.length > 0);
    (0, _util.assertType)(globs[0], "globs[0]", "string");

    var commonParts = globParentToArray(globs[0]);
    for (var i = 1, end = globs.length; i < end; ++i) {
        (0, _util.assertType)(globs[i], "globs[" + i + "]", "string");

        var parts = globParentToArray(globs[i]);
        var index = findLastCommonIndex(commonParts, parts);
        if (index === -1) {
            return null;
        }

        // remove all after the index.
        commonParts.splice(1 + index);
    }

    var common = commonParts.join("/");
    if (isDriveLeterOnly(common)) {
        return null;
    }
    if (hasDriveLeter(common)) {
        return common + "/";
    }
    return "/" + common + "/";
}