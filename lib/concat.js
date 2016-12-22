"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _getPrototypeOf = require("babel-runtime/core-js/object/get-prototype-of");

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _symbol = require("babel-runtime/core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

exports.default = concat;

var _stream = require("stream");

var _queue = require("./queue");

var _queue2 = _interopRequireDefault(_queue);

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var QUEUE = (0, _symbol2.default)("queue"); /**
                                             * @author Toru Nagashima
                                             * @copyright 2016 Toru Nagashima. All rights reserved.
                                             * See LICENSE file in root directory for full license.
                                             */

var CONCAT_TRANSFORM_OPTIONS = { allowHalfOpen: false };

var ConcatStream = function (_PassThrough) {
    (0, _inherits3.default)(ConcatStream, _PassThrough);

    function ConcatStream() {
        (0, _classCallCheck3.default)(this, ConcatStream);

        var _this = (0, _possibleConstructorReturn3.default)(this, (ConcatStream.__proto__ || (0, _getPrototypeOf2.default)(ConcatStream)).call(this, CONCAT_TRANSFORM_OPTIONS));

        _this[QUEUE] = new _queue2.default();
        return _this;
    }

    (0, _createClass3.default)(ConcatStream, [{
        key: "addSource",
        value: function addSource(source, end) {
            var _this2 = this;

            (0, _util.assert)(this[QUEUE] != null, "InvalidStateError");
            (0, _util.assertType)(end, "end", "boolean");

            this[QUEUE].push(function (next) {
                source.pipe(_this2, { end: end });
                source.on("end", next);
                source.on("error", function (err) {
                    _this2.emit("error", err);
                    next();
                });
            });

            if (end) {
                this[QUEUE] = null;
            }
        }
    }]);
    return ConcatStream;
}(_stream.PassThrough);

/**
 * Concatinates given readable streams.
 *
 * @param {stream.Readable} sources - A list of readable streams to concatinate.
 * @returns {stream.Readable} The concatinated stream.
 * @private
 */


function concat(sources) {
    var concatStream = new ConcatStream();
    var lastIndex = sources.length - 1;

    sources.forEach(function (source, index) {
        concatStream.addSource(source, index === lastIndex);
    });

    return concatStream;
}