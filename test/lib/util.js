import {exec, execSync} from "child_process";
import {writeFileSync, readFileSync} from "fs";
import {dirname} from "path";
import {sync as mkdirSync} from "mkdirp";

const AS_UTF8 = {encoding: "utf8"};

export function setup(files) {
  for (let path in files) {
    mkdirSync(dirname(path));
    writeFileSync(path, files[path]);
  }
}

export function content(path) {
  return readFileSync(path, AS_UTF8);
}

export function execCommand(argumentsText) {
  return execSync(
    `node lib/appcache-manifest.js ${argumentsText}`,
    {encoding: "utf8", stdio: []});
}

export function execFixer(argumentsText, source) {
  return execSync(
    `node lib/appcache-manifest-fixer.js ${argumentsText}`,
    {encoding: "utf8", input: source, stdio: []});
}

function waitFor(regexp) {
  return new Promise((resolve) => {
    this.stdout.setEncoding("utf8");
    this.stdout.on("data", function listener(chunk) {
      if (regexp.test(chunk)) {
        this.stdout.removeListener("data", listener);
        resolve(this);
      }
    }.bind(this));
  });
}

function kill() {
  return new Promise((resolve) => {
    this.stdin.write("KILL");
    this.on("exit", resolve);
  });
}

export function execCommandToWatch(argumentsText) {
  return new Promise((resolve, reject) => {
    const cp = exec(`node lib/appcache-manifest.js ${argumentsText} --verbose`);
    cp.waitForDone = waitFor.bind(cp, /Done\./);
    cp.kill = kill;

    waitFor.call(cp, /Be watching/).then(resolve);
    cp.on("error", reject);
  });
}
