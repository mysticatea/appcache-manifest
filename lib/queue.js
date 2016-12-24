/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
"use strict"

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const {assert, assertType} = require("./util")

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const SIZE = Symbol("size")
const TAIL = Symbol("tail")

/**
 * Execute actions in series.
 *
 * @param {Queue} queue - The queue instance.
 * @param {object} item - The queued item to be executed.
 * @returns {void}
 */
function dequeue(queue, item) {
    queue[SIZE] -= 1

    let done = false
    item.action(() => {
        if (done) {
            return
        }
        done = true

        if (item.next) {
            dequeue(queue, item.next)
        }
        else {
            assert(queue[TAIL] === item, "BROKEN")
            queue[TAIL] = null
        }
    })
}

/**
 * Queue for async jobs.
 *
 * @private
 */
class Queue {
    /**
     * Initialize.
     */
    constructor() {
        this[SIZE] = 0
        this[TAIL] = null
    }

    /**
     * The count of queued items.
     * @type {number}
     */
    get size() {
        return this[SIZE]
    }

    /**
     * Enqueue the action.
     *
     * @param {function} action - The function to be enqueued.
     * @returns {void}
     */
    push(action) {
        assertType(action, "action", "function")

        this[SIZE] += 1

        const item = {action, next: null}
        if (this[TAIL] != null) {
            this[TAIL].next = item
            this[TAIL] = item
        }
        else {
            this[TAIL] = item
            process.nextTick(() => dequeue(this, item))
        }
    }
}

//------------------------------------------------------------------------------
// Exports
//------------------------------------------------------------------------------

module.exports = Queue
