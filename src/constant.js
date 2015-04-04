import {Readable} from "stream";
import {assertType} from "./util";

const VALUE = Symbol("value");

class ConstantStream extends Readable {
  constructor(value) {
    super({
      highWaterMark: Buffer.byteLength(value),
      encoding: "utf8"
    });
    this[VALUE] = value;
  }

  _read() {
    this.push(this[VALUE]);
    this.push(null);
  }
}

export default function constant(value) {
  assertType(value, "value", "string");
  return new ConstantStream(value);
}
