import {assert, assertType} from "./util";

const SIZE = Symbol("size");
const TAIL = Symbol("tail");

function dequeue(queue, item) {
  queue[SIZE] -= 1;

  let done = false;
  item.action(() => {
    if (done) { return; }
    done = true;

    if (item.next) {
      dequeue(queue, item.next);
    }
    else {
      assert(queue[TAIL] === item, "BROKEN");
      queue[TAIL] = null;
    }
  });
}

export default class Queue {
  constructor() {
    this[SIZE] = 0;
    this[TAIL] = null;
  }

  get size() {
    return this[SIZE];
  }

  push(action) {
    assertType(action, "action", "function");

    this[SIZE] += 1;

    let item = {action, next: null};
    if (this[TAIL] != null) {
      this[TAIL].next = item;
      this[TAIL] = item;
    }
    else {
      this[TAIL] = item;
      process.nextTick(() => dequeue(this, item));
    }
  }
}
