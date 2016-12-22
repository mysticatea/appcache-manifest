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

exports.default = constant;

var _stream = require("stream");

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

var VALUE = (0, _symbol2.default)("value");

var ConstantStream = function (_Readable) {
    (0, _inherits3.default)(ConstantStream, _Readable);

    function ConstantStream(value) {
        (0, _classCallCheck3.default)(this, ConstantStream);

        var _this = (0, _possibleConstructorReturn3.default)(this, (ConstantStream.__proto__ || (0, _getPrototypeOf2.default)(ConstantStream)).call(this, {
            highWaterMark: Buffer.byteLength(value),
            encoding: "utf8"
        }));

        _this[VALUE] = value;
        return _this;
    }

    (0, _createClass3.default)(ConstantStream, [{
        key: "_read",
        value: function _read() {
            this.push(this[VALUE]);
            this.push(null);
        }
    }]);
    return ConstantStream;
}(_stream.Readable);

/**
 * Creates the stream which has a constant value.
 *
 * @param {string} value - A value.
 * @returns {stream.Readable} A readable stream of the value.
 * @private
 */


function constant(value) {
    (0, _util.assertType)(value, "value", "string");
    return new ConstantStream(value);
}