import {createHash} from "crypto";
import {createReadStream} from "fs";
import {join, relative} from "path";
import {Transform} from "stream";
import {create as createGlobStream} from "glob-stream";
import commonPart from "./common-part";
import concat from "./concat";
import constant from "./constant";
import Queue from "./queue";
import {assert, assertTypeOpt, toArray} from "./util";

const PREFIX = Symbol("prefix");
const FILES = Symbol("files");
const APPCACHE_TRANSFORM_OPTIONS = {
  allowHalfOpen: false,
  decodeStrings: false,
  writableObjectMode: true
};
const ALL_BACK_SLASH = /\\/g;

/**
 * Transform stream from glob-stream to manifest file content (string).
 * This has two aditional event.
 *   - "addpath" will be filed added path. `{path: string}`.
 *   - "addhash" will be filed added fingerpoint of paths. `{digest: string}`.
 */
class AppcacheTransform extends Transform {
  constructor(options) {
    super(APPCACHE_TRANSFORM_OPTIONS);
    assertTypeOpt(options && options.prefix, "options.prefix", "string");

    this[PREFIX] = (options && options.prefix) || "/";
    this[FILES] = [];

    assert(this[PREFIX][0] === "/", "options.prefix should be started with '/'.");

    this.push("CACHE MANIFEST\n");
  }

  get prefix() {
    return this[PREFIX];
  }

  _transform(file, encoding, cb) {
    const rel = relative(file.base, file.path.replace(ALL_BACK_SLASH, "/"));
    this[FILES].push({
      file: file.path,
      path: join(this.prefix, rel).replace(ALL_BACK_SLASH, "/")
    });
    cb();
  }

  _flush(cb) {
    // Sort by URL path.
    // readdir() doesn't guarantee order of files, but we needs it for md5.
    const files = this[FILES];
    files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? +1 : 0);

    // Process files on sequential.
    const queue = new Queue();
    const md5 = createHash("md5");
    files.forEach((item) => {
      queue.push((next) => {
        this.push(`${item.path}\n`);
        this.emit("addpath", {path: item.path});

        createReadStream(item.file)
          .on("data", (data) => { md5.update(data); })
          .on("end", next)
          .on("error", (err) => { next(); this.emit("error", err); });
      });
    });

    // Dump fingerpoint.
    queue.push((next) => {
      let digest = md5.digest("hex");
      this.push(`#${digest}\n`);
      this.emit("addhash", {digest});
      cb();
      next();
    });
  }
}

/**
 * @param {string|string[]} globs
 * @param {string|null} options.base
 * @param {string|null} options.prefix
 * @return {streams.Readable}
 */
function generateContent(globs, options) {
  options = options || {};

  // Detect base.
  globs = toArray(globs);
  assert(globs.length > 0, "globs should exist");
  let base = commonPart(globs);
  assert(base != null, "the common parent directory of globs is not found.");

  // Create streams.
  let globStream = createGlobStream(globs, {base});
  let appcacheStream = globStream.pipe(new AppcacheTransform(options));

  globStream.on("error", (err) => appcacheStream.emit("error", err));

  return appcacheStream;
}

/**
 * @param {string|string[]} globs
 * @param {string|null} options.base
 * @param {string|null} options.prefix
 * @param {string|string[]|null} options.postfile
 * @param {boolean|null} options.networkStar
 * @return {streams.Readable}
 */
export default function generate(globs, options) {
  // Create streams for content.
  let streams = [];
  streams.push(generateContent(globs, options));
  toArray(options.postfile).forEach((path) => {
    streams.push(createReadStream(path, {encoding: "utf8"}));
    streams.push(constant("\n"));
  });
  if (options.networkStar) {
    streams.push(constant("NETWORK:\n*\n"));
  }

  let concatStream = concat(streams);
  streams[0]
    .on("addpath", (e) => concatStream.emit("addpath", e))
    .on("addhash", (e) => concatStream.emit("addhash", e));

  return concatStream;
}
