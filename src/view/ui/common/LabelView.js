/**
 * Created by Alex on 26/05/2016.
 * @copyright Alex Goldring 2016
 */
import View from "../../View";
import { prettyPrint } from "../../../model/core/NumberFormat";
import ObservedValue from "../../../model/core/model/ObservedValue";
import Vector1 from "../../../model/core/geom/Vector1";
import LinearValue from "../../../model/core/model/LinearValue";
import ObservedString from "../../../model/core/model/ObservedString";
import BoundedValue from "../../../model/core/model/BoundedValue";
import ObservedBoolean from "../../../model/core/model/ObservedBoolean";
import Stat from "../../../model/core/model/stat/Stat";
import { isInstanceOf, isTypeOf } from "../../../model/core/process/matcher/Matchers";
import { frameThrottle } from "../../../model/graphics/FrameThrottle";
import { assert } from "../../../model/core/assert.js";
import ObservedInteger from "../../../model/core/model/ObservedInteger.js";
import { noop } from "../../../model/core/function/Functions.js";
import { isTypedArray } from "../../../model/core/json/JsonUtils.js";
import { or } from "../../../model/core/process/matcher/Matchers.js";


/**
 *
 * @param {Number|String|Boolean} value
 * @returns {*}
 */
function format(value) {
    if (typeof value === 'number') {
        return prettyPrint(value);
    } else {
        return value;
    }
}

/**
 *
 * @param {string} v
 * @returns {string|number}
 */
function formatNumber(v) {
    return prettyPrint(v);
}

function formatArray(arr) {
    return format(arr[0]) + " / " + format(arr[1]);
}

function extractorGetValue(m) {
    return m.getValue();
}

function extractFunction(f) {
    return f();
}

/**
 *
 * @param {BoundedValue} m
 */
function extractBoundedValue(m) {
    return [m.getValue(), m.getUpperLimit()];
}

function arrayUnwrap(elements) {
    return elements.map(function (element) {
        const processor = findProcessor(element);
        const extractor = processor.extractor;
        return extractor(element);
    });
}

/**
 *
 * @param model
 * @returns {ValueProcessor | undefined}
 */
function findProcessor(model) {
    return processors.find(function (p) {
        return p.matcher(model);
    });
}

/**
 * @template T
 * @param {T} v
 * @returns {T}
 */
function passThrough(v) {
    return v;
}


/**
 * @template Container, Value
 * @param {function(Container):boolean} matcher
 * @param {function(Container):Value} extractor
 * @param {function(Value):string} formatter
 * @constructor
 */
function ValueProcessor(matcher, extractor, formatter) {
    /**
     *
     * @type {function(*): boolean}
     */
    this.matcher = matcher;
    /**
     *
     * @type {function(*): *}
     */
    this.extractor = extractor;
    /**
     *
     * @type {function(*): string}
     */
    this.formatter = formatter;
}

/**
 *
 * @param {function(*):boolean} m
 * @param {function(*):*} e
 * @param {function(*):string} f
 * @returns {ValueProcessor}
 */
function p(m, e, f) {
    return new ValueProcessor(m, e, f);
}

/**
 *
 * @type {Array.<ValueProcessor>}
 */
const processors = [
    p(isInstanceOf(ObservedBoolean), extractorGetValue, format),
    p(isInstanceOf(ObservedValue), extractorGetValue, format),
    p(isInstanceOf(ObservedString), extractorGetValue, format),
    p(isInstanceOf(LinearValue), extractorGetValue, formatNumber),
    p(isInstanceOf(BoundedValue), extractBoundedValue, formatArray),
    p(isInstanceOf(Stat), extractorGetValue, formatNumber),
    p(isInstanceOf(Vector1), extractorGetValue, formatNumber),
    p(isInstanceOf(ObservedInteger), extractorGetValue, formatNumber),
    p(or(isTypedArray, Array.isArray), arrayUnwrap, formatArray),
    p(isTypeOf("number"), passThrough, formatNumber),
    p(isTypeOf("string"), passThrough, passThrough),
    p(isTypeOf("boolean"), passThrough, passThrough),
    p(isTypeOf("function"), extractFunction, format),
    p(isTypeOf("undefined"), passThrough, passThrough)
];

class LabelView extends View {
    constructor(model, { classList = [], transform, format = noop, tag = 'div' } = {}) {
        super(model, classList, transform, format, tag);

        this.model = model;
        const processor = findProcessor(model);
        const extractor = processor.extractor;
        const formatter = format !== noop ? format : processor.formatter;

        assert.notEqual(extractor, null, `No extractor was found for ${typeof model}(${model})`);
        assert.notEqual(formatter, null, `No formatter was found for ${typeof model}(${model})`);

        const el = this.el = document.createElement(tag);
        el.classList.add('label');

        classList.forEach(function (c) {
            el.classList.add(c);
        });

        function updateText(v) {
            el.textContent = v;
        }

        function update() {
            const data = extractor(model);
            const text = formatter(data);
            updateText(text);
        }

        function updateTransformed() {
            const data = extractor(model);
            const transformed = transform(data);
            const text = formatter(transformed);
            updateText(text);
        }

        if (typeof transform === 'function') {
            this.updateFunction = updateTransformed;
        } else {
            this.updateFunction = update;
        }

        this.throttledUpdate = frameThrottle(this.updateFunction);

        function updateLineHeight(x, y) {
            el.style.lineHeight = y + "px";
        }

        this.size.onChanged.add(updateLineHeight);

        if (typeof this.model === "object" && this.model.onChanged !== undefined) {
            this.bindSignal(this.model.onChanged, this.throttledUpdate);
        }
    }

    link() {
        super.link();

        this.updateFunction();
    }
}


export default LabelView;
