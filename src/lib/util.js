/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

module.exports.assert = function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
};

module.exports.assertType = function assertType(value, name, type) {
    if (typeof value !== type) {
        throw new TypeError(`${name} should be a ${type}.`);
    }
};

module.exports.assertTypeOpt = function assertTypeOpt(value, name, type) {
    if (value != null && typeof value !== type) {
        throw new TypeError(`${name} should be a ${type} or null.`);
    }
};
