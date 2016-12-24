/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const assert = require("power-assert")
const co = require("co")
const {sync: removeSync} = require("rimraf")
const {setup, content, execFixer} = require("./lib/util")

describe("appcache-manifest-fixer", () => {
    before(() => {
        removeSync("test-ws")
    })
    beforeEach(() => {
        setup({"test-ws/a.html": "<html><head></head><body>aaa!</body></html>"})
    })
    afterEach(() => {
        removeSync("test-ws")
    })

    //--------------------------------------------------------------------------
    describe("should add a manifest attribute.", () => {
        it("stdio", co.wrap(function* () {
            const result = yield execFixer([], "<html><head></head><body>hello!</body></html>")
            assert(result === "<html manifest=\"index.appcache\"><head></head><body>hello!</body></html>")
        }))

        it("from file", co.wrap(function* () {
            const result = yield execFixer(["test-ws/a.html"])
            assert(result === "<html manifest=\"index.appcache\"><head></head><body>aaa!</body></html>")
        }))

        it("to file", co.wrap(function* () {
            yield execFixer(["--output", "test-ws/b.html"], "<html><head></head><body>hello!</body></html>")
            assert(content("test-ws/b.html") === "<html manifest=\"index.appcache\"><head></head><body>hello!</body></html>")
        }))

        it("even if <html> has other attributes.", co.wrap(function* () {
            const result = yield execFixer([], "<html lang=\"ja\"><head></head><body>hello!</body></html>")
            assert(result === "<html manifest=\"index.appcache\" lang=\"ja\"><head></head><body>hello!</body></html>")
        }))

        it("--manifest option", co.wrap(function* () {
            const result = yield execFixer(["--manifest", "a"], "<html><head></head><body>hello!</body></html>")
            assert(result === "<html manifest=\"a\"><head></head><body>hello!</body></html>")
        }))
    })
})
