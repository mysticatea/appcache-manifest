/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const fork = require("child_process").fork
const fs = require("fs")
const path = require("path")
const mkdirSync = require("mkdirp").sync

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const AS_UTF8 = { encoding: "utf8" }

/**
 * Executes a specific file on Node.js.
 *
 * @param {string} file - A file to execute.
 * @param {string[]} args - Arguments.
 * @param {string|undefined} source - The value to send to stdin.
 * @returns {Promise} The promise to wait until the child process exit.
 */
function execNode(file, args, source) {
    return new Promise((resolve, reject) => {
        const cp = fork(file, args, { silent: true })
        let stdout = ""
        let stderr = ""

        cp.stdout.setEncoding("utf8")
        cp.stdout.on("data", (chunk) => {
            stdout += chunk
        })
        cp.stderr.setEncoding("utf8")
        cp.stderr.on("data", (chunk) => {
            stderr += chunk
        })
        cp.on("exit", (exitCode) => {
            if (exitCode) {
                reject(new Error(`Non-Zero Exit(${exitCode}): ${stderr}.`))
            }
            else {
                resolve(stdout)
            }
        })
        cp.on("error", reject)

        if (source) {
            cp.stdin.end(source)
        }
    })
}

/**
 * Creates a promise to wait until specific text is found in this stdout.
 *
 * @param {RegExp} regexp - A text pattern to match.
 * @returns {Promise} A promise to wait for the pattern.
 * @this child_process.ChildProcess
 */
function waitFor(regexp) {
    return new Promise(resolve => {
        this.stdout.setEncoding("utf8")
        this.stdout.on("data", function listener(chunk) {
            if (regexp.test(chunk)) {
                this.stdout.removeListener("data", listener)
                resolve(this)
            }
        }.bind(this))
    })
}

/**
 * Creates a promise to wait until this process is killed.
 *
 * @returns {Promise} A promise to wait for killed.
 * @this child_process.ChildProcess
 */
function kill() {
    return new Promise((resolve, reject) => {
        this.send("KILL")
        this.on("exit", resolve)
        this.on("error", reject)
    })
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

/**
 * Prepares test files.
 *
 * @param {object} files - A map of files.
 *      Keys are file path.
 *      Values are the content of each file.
 * @returns {void}
 */
module.exports.setup = function setup(files) {
    for (const file of Object.keys(files)) {
        mkdirSync(path.dirname(file))
        fs.writeFileSync(file, files[file])
    }
}

/**
 * Reads the content of the given path.
 *
 * @param {string} file - A file path to read.
 * @returns {string} The content of the file.
 */
module.exports.content = function content(file) {
    return fs.readFileSync(file, AS_UTF8)
}

/**
 * Executes `appcache-manifest` command with given arguments.
 *
 * @param {string[]} args - Arguments.
 * @returns {Promise} The promise to wait until the child process exit.
 */
module.exports.execCommand = function execCommand(args) {
    return execNode("bin/appcache-manifest.js", args)
}

/**
 * Executes `appcache-manifest-fixer` command with given arguments.
 *
 * @param {string[]} args - Arguments.
 * @param {string|Buffer} source - The content of the command's target.
 * @returns {Promise} The promise to wait until the child process exit.
 */
module.exports.execFixer = function execFixer(args, source) {
    return execNode("bin/appcache-manifest-fixer.js", args, source)
}

/**
 * Executes `appcache-manifest` command with given arguments.
 *
 * @param {string[]} args - Arguments.
 * @returns {Promise} The promise to wait until the command started watching.
 */
module.exports.execCommandToWatch = function execCommandToWatch(args) {
    return new Promise((resolve, reject) => {
        const cp = fork("bin/appcache-manifest.js", args.concat(["--verbose"]), { silent: true })
        cp.waitFor = waitFor
        cp.waitForDone = () => cp.waitFor(/Done\./)
        cp.kill = kill

        cp.waitFor(/Be watching/).then(resolve)
        cp.on("error", reject)
    })
}
