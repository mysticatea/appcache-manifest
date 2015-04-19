import {resolve} from "path";
import globParent from "glob-parent";
import {assert, assertType} from "./util";

const BACK_SLASH = /\\/g;
function pathToArray(path) {
  return path.replace(BACK_SLASH, "/").split("/").filter(Boolean);
}

function globParentToArray(glob) {
  return pathToArray(resolve(globParent(glob)));
}

function findLastCommonIndex(xs, ys) {
  for (let i = Math.min(xs.length, ys.length) - 1; i >= 0; --i) {
    if (xs[i] === ys[i]) {
      return i;
    }
  }
  return -1;
}

const DRIVE_LETER_ONLY = /^[a-zA-Z]+:$/;
function isDriveLeterOnly(path) {
  return DRIVE_LETER_ONLY.test(path);
}

const DRIVE_LETER = /^[a-zA-Z]+:/;
function hasDriveLeter(path) {
  return DRIVE_LETER.test(path);
}

/**
 * @param {string[]} globs
 * @return {string|null} the common part (directory).
 */
export default function commonPart(globs) {
  assert(globs.length > 0);
  assertType(globs[0], "globs[0]", "string");

  let commonParts = globParentToArray(globs[0]);
  for (let i = 1, end = globs.length; i < end; ++i) {
    assertType(globs[i], `globs[${i}]`, "string");

    let parts = globParentToArray(globs[i]);
    let index = findLastCommonIndex(commonParts, parts);
    if (index === -1) {
      return null;
    }

    // remove all after the index.
    commonParts.splice(1 + index);
  }

  let common = commonParts.join("/");
  if (isDriveLeterOnly(common)) {
    return null;
  }
  if (hasDriveLeter(common)) {
    return common + "/";
  }
  return "/" + common + "/";
}
