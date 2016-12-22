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

exports.default = createFixer;

var _stream = require("stream");

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @author Toru Nagashima
 * @copyright 2016 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

var MANIFEST = (0, _symbol2.default)("manifest");
var BUFFER = (0, _symbol2.default)("buffer");
var HTML_TAG_FOUND = (0, _symbol2.default)("html-tag-found");
var HTML_PATTERN = /(<html)(\s|>)/i;

var Fixer = function (_Transform) {
    (0, _inherits3.default)(Fixer, _Transform);

    function Fixer(options) {
        (0, _classCallCheck3.default)(this, Fixer);

        (0, _util.assertTypeOpt)(options && options.manifest, "options.manifest", "string");

        var _this = (0, _possibleConstructorReturn3.default)(this, (Fixer.__proto__ || (0, _getPrototypeOf2.default)(Fixer)).call(this));

        _this[MANIFEST] = options && options.manifest || "index.appcache";
        _this[BUFFER] = "";
        _this[HTML_TAG_FOUND] = false;
        return _this;
    }

    (0, _createClass3.default)(Fixer, [{
        key: "_transform",
        value: function _transform(chunk, encoding, callback) {
            var _this2 = this;

            if (this[HTML_TAG_FOUND]) {
                this.push(chunk);
            } else {
                this[BUFFER] += chunk.toString();
                this[BUFFER] = this[BUFFER].replace(HTML_PATTERN, function (_, pre, post) {
                    _this2[HTML_TAG_FOUND] = true;
                    return pre + " manifest=\"" + _this2[MANIFEST] + "\"" + post;
                });

                if (this[HTML_TAG_FOUND]) {
                    this.push(this[BUFFER]);
                    this[BUFFER] = null;
                }
            }
            callback();
        }
    }, {
        key: "_flush",
        value: function _flush(callback) {
            if (this[BUFFER] != null) {
                this.push(this[BUFFER]);
            }
            callback();
        }
    }]);
    return Fixer;
}(_stream.Transform);

function createFixer(options) {
    return new Fixer(options);
}