"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _symbol = require("babel-runtime/core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SIZE = (0, _symbol2.default)("size"); /**
                                           * @author Toru Nagashima
                                           * @copyright 2016 Toru Nagashima. All rights reserved.
                                           * See LICENSE file in root directory for full license.
                                           */

var TAIL = (0, _symbol2.default)("tail");

function dequeue(queue, item) {
    queue[SIZE] -= 1;

    var done = false;
    item.action(function () {
        if (done) {
            return;
        }
        done = true;

        if (item.next) {
            dequeue(queue, item.next);
        } else {
            (0, _util.assert)(queue[TAIL] === item, "BROKEN");
            queue[TAIL] = null;
        }
    });
}

/**
 * Queue for async jobs.
 *
 * @private
 */

var Queue = function () {
    function Queue() {
        (0, _classCallCheck3.default)(this, Queue);

        this[SIZE] = 0;
        this[TAIL] = null;
    }

    (0, _createClass3.default)(Queue, [{
        key: "push",
        value: function push(action) {
            var _this = this;

            (0, _util.assertType)(action, "action", "function");

            this[SIZE] += 1;

            var item = { action: action, next: null };
            if (this[TAIL] != null) {
                this[TAIL].next = item;
                this[TAIL] = item;
            } else {
                this[TAIL] = item;
                process.nextTick(function () {
                    return dequeue(_this, item);
                });
            }
        }
    }, {
        key: "size",
        get: function get() {
            return this[SIZE];
        }
    }]);
    return Queue;
}();

exports.default = Queue;