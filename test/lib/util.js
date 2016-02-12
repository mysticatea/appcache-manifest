import {fork} from "child_process";
import {writeFileSync, readFileSync} from "fs";
import {dirname} from "path";
import {sync as mkdirSync} from "mkdirp";

const AS_UTF8 = {encoding: "utf8"};

/**
 * Prepares test files.
 *
 * @param {object} files - A map of files.
 *      Keys are file path.
 *      Values are the content of each file.
 * @returns {void}
 */
export function setup(files) {
    for (const path in files) {
        mkdirSync(dirname(path));
        writeFileSync(path, files[path]);
    }
}

/**
 * Reads the content of the given path.
 *
 * @param {string} path - A file path to read.
 * @returns {string} The content of the file.
 */
export function content(path) {
    return readFileSync(path, AS_UTF8);
}

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
        const cp = fork(file, args, {silent: true});
        let stdout = "";
        let stderr = "";

        cp.stdout.setEncoding("utf8");
        cp.stdout.on("data", (chunk) => { stdout += chunk; });
        cp.stderr.setEncoding("utf8");
        cp.stderr.on("data", (chunk) => { stderr += chunk; });
        cp.on("exit", (exitCode) => {
            if (exitCode) {
                reject(new Error(`Non-Zero Exit(${exitCode}): ${stderr}.`));
            }
            else {
                resolve(stdout);
            }
        });
        cp.on("error", reject);

        if (source) {
            cp.stdin.end(source);
        }
    });
}

/**
 * Executes `appcache-manifest` command with given arguments.
 *
 * @param {string[]} args - Arguments.
 * @returns {Promise} The promise to wait until the child process exit.
 */
export function execCommand(args) {
    return execNode("src/bin/appcache-manifest.js", args);
}

/**
 * Executes `appcache-manifest-fixer` command with given arguments.
 *
 * @param {string[]} args - Arguments.
 * @param {string|Buffer} source - The content of the command's target.
 * @returns {Promise} The promise to wait until the child process exit.
 */
export function execFixer(args, source) {
    return execNode("src/bin/appcache-manifest-fixer.js", args, source);
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
        this.stdout.setEncoding("utf8");
        this.stdout.on("data", function listener(chunk) {
            if (regexp.test(chunk)) {
                this.stdout.removeListener("data", listener);
                resolve(this);
            }
        }.bind(this));
    });
}

/**
 * Creates a promise to wait until this process is killed.
 *
 * @returns {Promise} A promise to wait for killed.
 * @this child_process.ChildProcess
 */
function kill() {
    return new Promise((resolve, reject) => {
        this.stdin.write("KILL");
        this.on("exit", resolve);
        this.on("error", reject);
    });
}

/**
 * Executes `appcache-manifest` command with given arguments.
 *
 * @param {string[]} args - Arguments.
 * @returns {Promise} The promise to wait until the command started watching.
 */
export function execCommandToWatch(args) {
    return new Promise((resolve, reject) => {
        const cp = fork("src/bin/appcache-manifest.js", [...args, "--verbose"], {silent: true});
        cp.waitFor = waitFor;
        cp.waitForDone = () => cp.waitFor(/Done\./);
        cp.kill = kill;

        cp.waitFor(/Be watching/).then(resolve);
        cp.on("error", reject);
    });
}
