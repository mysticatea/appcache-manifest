/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

module.exports = {
    generate: require("./lib/generate").default,
    createFixer: require("./lib/fixer").default
};
