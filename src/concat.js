import {PassThrough} from "stream";
import Queue from "./queue";
import {assert, assertType} from "./util";

const QUEUE = Symbol("queue");
const CONCAT_TRANSFORM_OPTIONS = {allowHalfOpen: false};

class ConcatStream extends PassThrough {
  constructor() {
    super(CONCAT_TRANSFORM_OPTIONS);
    this[QUEUE] = new Queue();
  }

  addSource(source, end) {
    assert(this[QUEUE] != null, "InvalidStateError");
    assertType(end, "end", "boolean");

    this[QUEUE].push((next) => {
      source.pipe(this, {end});
      source.on("end", next);
      source.on("error", (err) => {
        this.emit("error", err);
        next();
      });
    });

    if (end) {
      this[QUEUE] = null;
    }
  }
}

export default function concat(sources) {
  let concatStream = new ConcatStream();
  let lastIndex = sources.length - 1;

  sources.forEach((source, index) => {
    concatStream.addSource(source, index === lastIndex);
  });

  return concatStream;
}
