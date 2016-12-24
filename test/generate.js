/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

const assert = require("power-assert")
const co = require("co")
const {sync: removeSync} = require("rimraf")
const {setup, content, execCommand} = require("./lib/util")

describe("appcache-manifest", () => {
    before(() => {
        removeSync("test-ws1")
        removeSync("test-ws2")
        removeSync("test-ws3")
    })
    beforeEach(() => {
        setup({
            "test-ws1/a.txt": "AAA",
            "test-ws1/b.txt": "BBB",
            "test-ws1/c.dat": "Not includes",
            "test-ws1/d/d.txt": "DDD",
            "test-ws1/post1": "POST1",
            "test-ws1/post2": "POST2",
            "test-ws2/a.txt": "AAA",
            "test-ws2/b.txt": "BBB",
            "test-ws2/c.dat": "Not includes",
            "test-ws2/d/d.txt": "DDD",
        })
    })
    afterEach(() => {
        removeSync("test-ws1")
        removeSync("test-ws2")
        removeSync("test-ws3")
    })

    //--------------------------------------------------------------------------
    describe("should generate paths and fingerprint in CACHE section.", () => {
        it("with single glob.", co.wrap(function* () {
            const result = yield execCommand(["test-ws1/**/*.txt"])
            assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
`)
        }))

        it("with multiple globs.", co.wrap(function* () {
            const result = yield execCommand([
                "test-ws1/**/*.txt",
                "test-ws2/**/*.txt",
            ])
            assert(result === `CACHE MANIFEST
/test-ws1/a.txt
/test-ws1/b.txt
/test-ws1/d/d.txt
/test-ws2/a.txt
/test-ws2/b.txt
/test-ws2/d/d.txt
#7ccc78fc61b9f1daff3b91e263772392
`)
        }))
    })

    //--------------------------------------------------------------------------
    describe("--output option", () => {
        it("should create the file.", co.wrap(function* () {
            yield execCommand([
                "test-ws1/**/*.txt",
                "--output",
                "test-ws3/test.appcache",
            ])
            assert(content("test-ws3/test.appcache") === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
`)
        }))
    })

    //--------------------------------------------------------------------------
    describe("--prefix option", () => {
        it("should concatenate before URL-path.", co.wrap(function* () {
            const result = yield execCommand([
                "test-ws1/**/*.txt",
                "--prefix",
                "/z",
            ])
            assert(result === `CACHE MANIFEST
/z/a.txt
/z/b.txt
/z/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
`)
        }))

        it("should fail if is specified 2 or more.", co.wrap(function* () {
            try {
                yield execCommand([
                    "test-ws1/**/*.txt",
                    "--prefix",
                    "/z",
                    "--prefix",
                    "/y",
                ])
                assert(false, "should fail")
            }
            catch (_err) {
                // OK.
            }
        }))

        it("should fail if is specified non-absolute-path.", co.wrap(function* () {
            try {
                yield execCommand([
                    "test-ws1/**/*.txt",
                    "--prefix",
                    "z",
                ])
                assert(false, "should fail")
            }
            catch (_err) {
                // OK.
            }
        }))
    })

    //--------------------------------------------------------------------------
    describe("--postfile option", () => {
        it("should concatenate the file's content after the generated contents.", co.wrap(function* () {
            const result = yield execCommand([
                "test-ws1/**/*.txt",
                "--postfile",
                "test-ws1/post1",
            ])
            assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
POST1
`)
        }))

        it("should concatenate the all files.", co.wrap(function* () {
            const result = yield execCommand([
                "test-ws1/**/*.txt",
                "--postfile",
                "test-ws1/post1",
                "--postfile",
                "test-ws1/post2",
            ])
            assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
POST1
POST2
`)
        }))

        it("should fail if the file not found.", co.wrap(function* () {
            try {
                yield execCommand([
                    "test-ws1/**/*.txt",
                    "--postfile",
                    "test-ws1/post3",
                ])
                assert(false, "should fail")
            }
            catch (_err) {
                // OK.
            }
        }))
    })

    //--------------------------------------------------------------------------
    describe("--verbose option", () => {
        it("should fail if there is not --output option.", co.wrap(function* () {
            try {
                yield execCommand([
                    "test-ws1/**/*.txt",
                    "--verbose",
                ])
                assert(false, "should fail")
            }
            catch (_err) {
                // OK.
            }
        }))
    })

    //--------------------------------------------------------------------------
    describe("--network-star option", () => {
        it("should append \"NETWORK:\\n*\" into the generated contents.", co.wrap(function* () {
            const result = yield execCommand([
                "test-ws1/**/*.txt",
                "--network-star",
            ])
            assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
NETWORK:
*
`)
        }))

        it("should append it after postfiles.", co.wrap(function* () {
            const result = yield execCommand([
                "test-ws1/**/*.txt",
                "--network-star",
                "--postfile",
                "test-ws1/post1",
            ])
            assert(result === `CACHE MANIFEST
/a.txt
/b.txt
/d/d.txt
#7e23edcaae22a404a2e489278ee133f3
POST1
NETWORK:
*
`)
        }))
    })

    //--------------------------------------------------------------------------
    describe("--stamp option", () => {
        it("should include \"# Created at ... \" into the generated contents replacing fingerprint.", co.wrap(function* () {
            const result = yield execCommand([
                "test-ws1/**/*.txt",
                "--stamp",
            ])
            assert(result.match(new RegExp("# Created at ", "i")))
        }))
        it("should not include the fingerprint.", co.wrap(function* () {
            const result = yield execCommand([
                "test-ws1/**/*.txt",
                "--stamp",
            ])
            assert(!result.match(new RegExp("#7e23edcaae22a404a2e489278ee133f3", "i")))
        }))
    })
})
