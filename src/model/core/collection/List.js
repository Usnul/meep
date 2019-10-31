/**
 * @author Alex Goldring
 * @copyright Alex Goldring 2016
 */

import Signal from '../events/signal/Signal.js';
import { assert } from "../assert.js";


/**
 * @callback List~ConsumerCallback
 * @template T
 * @param {T} element
 * @param {number} [index]
 */

/**
 * List structure with event signals for observing changes.
 * @param {Array.<T>} [array]
 * @template T
 * @constructor
 * @property {{added: Signal, removed: Signal}} on
 */
function List(array) {
    this.on = {
        added: new Signal(),
        removed: new Signal()
    };

    /**
     * @type {T[]}
     */
    this.data = array !== undefined ? array.slice() : [];

    /**
     *
     * @type {number}
     */
    this.length = this.data.length;
}

/**
 *
 * @param {number} index
 * @returns {T}
 */
List.prototype.get = function (index) {
    return this.data[index];
};

/**
 *
 * @param {number} index
 * @param {T} value
 */
List.prototype.set = function (index, value) {
    const oldValue = this.data[index];

    if (oldValue !== undefined) {
        this.on.removed.send2(oldValue, index)
    } else {
        if (index >= this.length) {

            this.length = index + 1;

            if (index > this.length) {
                console.error(`Overflow, attempted to set element at ${index} past the list length(=${this.length})`);
            }

        }
    }

    this.data[index] = value;

    this.on.added.send2(value, index);
};

/**
 *
 * @param {T} el
 */
List.prototype.add = function (el) {
    this.data.push(el);
    const oldLength = this.length;

    this.length++;

    this.on.added.send2(el, oldLength);
    return this;
};

/**
 * Insert element at a specific position into the list
 * @param {number} index
 * @param {T} el
 * @returns {List}
 * @throws {Error} when trying to insert past list end
 */
List.prototype.insert = function (index, el) {

    if (index > this.length) {
        console.error(`Overflow, attempted to insert element at ${index} past the list length(=${this.length})`);
        this.length = index + 1;
    }

    this.data.splice(index, 0, el);

    this.length++;

    this.on.added.send2(el, index);

    return this;
};

/**
 * Reduces the list to a sub-section but removing everything before startIndex and everything after endIndex
 * @param {int} startIndex
 * @param {int} endIndex
 * @returns {number}
 */
List.prototype.crop = function (startIndex, endIndex) {

    const data = this.data;

    const tail = data.splice(endIndex, this.length - endIndex);

    const head = data.splice(0, startIndex);

    this.length = endIndex - startIndex;


    const headLength = head.length;

    const tailLength = tail.length;

    const onRemoved = this.on.removed;

    if (onRemoved.hasHandlers()) {
        let i;

        for (i = 0; i < headLength; i++) {
            onRemoved.send2(head[i], i);
        }


        for (i = 0; i < tailLength; i++) {
            onRemoved.send2(tail[i], endIndex + i);
        }
    }

    //return number of dropped elements
    return headLength + tailLength;
};

/**
 *
 * @param {Array.<T>} elements
 */
List.prototype.addAll = function (elements) {
    const addedElementsCount = elements.length;

    const added = this.on.added;

    if (added.hasHandlers()) {
        //only signal if there are listeners attached
        for (let i = 0; i < addedElementsCount; i++) {
            const element = elements[i];
            this.data.push(element);
            added.send2(element, this.length++);
        }
    } else {
        //no observers, we can add elements faster
        Array.prototype.push.apply(this.data, elements);
        this.length += addedElementsCount;
    }
};

/**
 *
 * @param {Array.<T>} elements
 */
List.prototype.addAllUnique = function (elements) {
    const data = this.data;

    const unique = elements.filter(function (e, i) {
        return data.indexOf(e) === -1 && elements.indexOf(e, i + 1) === -1;
    });

    this.addAll(elements);
};

/**
 *
 * @param {number} index
 * @param {number} removeCount
 * @returns {T[]}
 */
List.prototype.removeMany = function (index, removeCount) {
    assert.equal(typeof index, 'number', `index must a number, instead was '${typeof index}'`);
    assert.ok(index < this.length || index < 0, `index(=${index}) out of range (${this.length})`);

    const els = this.data.splice(index, removeCount);

    const removedCount = els.length;

    this.length -= removedCount;

    assert.equal(this.length, this.data.length, `length(=${this.length}) is inconsistent with underlying data array length(=${this.data.length})`)

    if (this.on.removed.hasHandlers()) {
        for (let i = 0; i < removedCount; i++) {
            const element = els[i];

            this.on.removed.send2(element, index + i);
        }
    }

    return els;
};

/**
 *
 * @param {number} index
 * @returns {T}
 */
List.prototype.remove = function (index) {
    assert.equal(typeof index, 'number', `index must a number, instead was '${typeof index}'`);
    assert.ok(index < this.length || index < 0, `index(=${index}) out of range (${this.length})`);

    const els = this.data.splice(index, 1);

    this.length--;

    assert.equal(this.length, this.data.length, `length(=${this.length}) is inconsistent with underlying data array length(=${this.data.length})`)

    const element = els[0];

    this.on.removed.send2(element, index);

    return element;
};

/**
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
function objectsEqual(a, b) {
    return a === b || (typeof a.equals === "function" && a.equals(b));
}

/**
 *
 * @param {Array.<T>} elements
 * @returns {boolean} True is all specified elements were found and removed, False if some elements were not present in the list
 */
List.prototype.removeAll = function (elements) {
    let i, il;
    let j, jl;

    il = elements.length;
    jl = this.length;

    let missCount = 0;

    const data = this.data;

    main_loop: for (i = 0; i < il; i++) {

        const expected = elements[i];

        for (j = jl - 1; j >= 0; j--) {

            const actual = data[j];

            if (objectsEqual(actual, expected)) {

                this.remove(j);

                jl--;


                continue main_loop;

            }

        }


        missCount++;
    }

    //some elements were not deleted
    return missCount === 0;
};

function conditionEqualsViaMethod(v) {
    return this === v || this.equals(v);
}

function conditionEqualsStrict(v) {
    return this === v;
}

/**
 *
 * @param {T} value
 * @return {boolean}
 */
List.prototype.removeOneOf = function (value) {
    if (typeof value === "object" && typeof value.equals === "function") {
        return this.removeOneIf(conditionEqualsViaMethod, value);
    } else {
        return this.removeOneIf(conditionEqualsStrict, value);
    }
};

List.prototype.sort = function () {
    Array.prototype.sort.apply(this.data, arguments);
    return this;
};

/**
 * Copy of this list
 * @returns {List.<T>}
 */
List.prototype.clone = function () {
    return new List(this.data);
};

/**
 *
 * @param {function(element:T):boolean} condition
 * @returns {boolean}
 */
List.prototype.some = function (condition) {
    const l = this.length;
    const data = this.data;
    for (let i = 0; i < l; i++) {
        if (condition(data[i])) {
            return true;
        }
    }
    return false;
};

/**
 *
 * @param {function} condition must return boolean value
 */
List.prototype.removeIf = function (condition) {
    let l = this.length;
    const data = this.data;
    for (let i = 0; i < l; i++) {
        if (condition(data[i])) {
            this.remove(i);
            i--;
            l--;
        }
    }
};

/**
 *
 * @param {function(T):boolean} condition
 * @param {*} [thisArg]
 * @return {boolean}
 */
List.prototype.removeOneIf = function (condition, thisArg) {
    const l = this.length;
    const data = this.data;

    for (let i = 0; i < l; i++) {
        const element = data[i];

        if (condition.call(thisArg, element)) {
            this.remove(i);
            return true;
        }
    }

    return false;
};

/**
 * INVARIANT: List length must not change during the traversal
 * @param {function(el:T, index:number):?} f
 * @param {*} [thisArg]
 */
List.prototype.forEach = function (f, thisArg) {
    const l = this.length;
    const data = this.data;

    for (let i = 0; i < l; i++) {

        f.call(thisArg, data[i], i);

    }
};

/**
 * @param {function(*,T):*} f
 * @param {*} initial
 * @returns {*}
 */
List.prototype.reduce = function (f, initial) {
    let t = initial;
    this.forEach(function (v) {
        t = f(t, v);
    });
    return t;
};

/**
 *
 * @param {function(T):boolean} f
 * @returns {Array.<T>}
 */
List.prototype.filter = function (f) {
    return this.data.filter(f);
};

/**
 *
 * @param {function(el:T):boolean} matcher
 * @returns {T|undefined}
 */
List.prototype.find = function (matcher) {
    const data = this.data;
    let i = 0;
    const l = this.length;
    for (; i < l; i++) {
        const el = data[i];
        if (matcher(el)) {
            return el;
        }
    }

    return undefined;
};

/**
 *
 * @param {function} matcher
 * @param {List~ConsumerCallback<T>} callback
 */
List.prototype.visitFirstMatch = function (matcher, callback) {
    const data = this.data;
    let i = 0;
    const l = this.length;
    for (; i < l; i++) {
        const el = data[i];
        if (matcher(el)) {
            callback(el, i);
            return;
        }
    }
};
/**
 *
 * @param {T} v
 * @returns {boolean}
 */
List.prototype.contains = function (v) {
    return this.data.indexOf(v) !== -1;
};

/**
 * List has no elements
 * @returns {boolean}
 */
List.prototype.isEmpty = function () {
    return this.length <= 0;
};

/**
 *
 * @param {T} el
 * @returns {number}
 */
List.prototype.indexOf = function (el) {
    return this.data.indexOf(el);
};

/**
 * @template R
 * @param {function(T):R} callback
 * @param {*} [thisArg]
 * @returns {R[]}
 */
List.prototype.map = function (callback, thisArg) {
    const result = [];
    const data = this.data;
    const l = this.length;

    for (let i = 0; i < l; i++) {

        const datum = data[i];
        if (datum !== undefined) {
            result[i] = callback.call(thisArg, datum, i);
        }
    }

    return result;
};

List.prototype.reset = function () {
    const length = this.length;
    if (length > 0) {
        const oldElements = this.data;
        const removed = this.on.removed;
        if (removed.hasHandlers()) {
            //only signal if there are listeners attached
            for (let i = length - 1; i >= 0; i--) {
                const element = oldElements[i];
                // decrement data length gradually to allow handlers access to the rest of the elements
                this.data.length = i;
                this.length = i;
                removed.dispatch(element, i);
            }
        } else {
            this.data = [];
            this.length = 0;
        }
    }
};

/**
 *
 * @param {List<T>} other
 * @param {class<T>} ElementKlass
 */
List.prototype.deepCopy = function (other, ElementKlass) {
    assert.notEqual(other, undefined, 'other is undefined');
    assert.notEqual(other, null, 'other is null');

    assert.notEqual(ElementKlass, undefined, 'ElementKlass is undefined');
    assert.notEqual(ElementKlass, null, 'ElementKlass is null');

    this.reset();

    other.forEach(el => {
        const clone = new ElementKlass();

        clone.copy(el);

        this.add(el);
    });
};

List.prototype.copy = function (other) {
    if (this !== other) {
        this.reset();
        if (other.length > 0) {
            if (other instanceof List) {
                this.addAll(other.data);
            } else {
                this.addAll(other);
            }
        }
    }
};

/**
 *
 * @param {List} other
 * @param {function} elementComparator
 * @returns {number} -1, 0 or 1
 */
List.prototype.compare = function (other, elementComparator) {
    const thisLength = this.length;
    const otherLength = other.length;

    const deltaLength = thisLength - otherLength;

    if (deltaLength !== 0) {
        return deltaLength;
    }

    for (let i = 0; i < thisLength; i++) {
        const thisElement = this.get(i);
        const otherElement = other.get(i);

        if (thisElement === otherElement) {
            continue;
        }

        const elementDelta = elementComparator(thisElement, otherElement);

        if (elementDelta !== 0) {
            return elementDelta;
        }
    }

    return 0;
};

/**
 *
 * @returns {Array.<T>}
 */
List.prototype.asArray = function () {
    return this.data;
};

List.prototype.toJSON = function () {
    return JSON.parse(JSON.stringify(this.data));
};

/**
 *
 * @param {object} json
 * @param {function} constructor
 */
List.prototype.fromJSON = function (json, constructor) {
    this.reset();
    if (typeof constructor === "function") {
        this.addAll(json.map(function (elJSON) {
            const el = new constructor();
            el.fromJSON(elJSON);
            return el;
        }));
    } else {
        this.addAll(json);
    }
};


/**
 *
 * @param {BinaryBuffer} buffer
 */
List.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUint32(this.length);

    this.forEach(function (item) {
        item.toBinaryBuffer(buffer);
    });
};

/**
 *
 * @param {BinaryBuffer} buffer
 * @param constructor
 */
List.prototype.fromBinaryBuffer = function (buffer, constructor) {
    this.fromBinaryBufferViaFactory(buffer, function (buffer) {

        const el = new constructor();

        el.fromBinaryBuffer(buffer);

        return el;
    });
};

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {function(buffer:BinaryBuffer)} factory
 */
List.prototype.fromBinaryBufferViaFactory = function (buffer, factory) {
    this.reset();

    this.addFromBinaryBufferViaFactory(buffer, factory);
};
/**
 *
 * @param {BinaryBuffer} buffer
 * @param {function(buffer:BinaryBuffer)} factory
 */
List.prototype.addFromBinaryBufferViaFactory = function (buffer, factory) {
    const length = buffer.readUint32();

    for (let i = 0; i < length; i++) {
        const el = factory(buffer);

        this.add(el);
    }
};

/**
 * NOTE: Elements must have hash method
 * @returns {number}
 */
List.prototype.hash = function () {
    let hash = 0;
    const length = this.length;

    for (let i = 0; i < length; i++) {
        const datum = this.data[i];
        const singleValue = datum.hash();
        hash = ((hash << 5) - hash) + singleValue;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
};

/**
 *
 * @return {T|undefined}
 */
List.prototype.last = function () {
    return this.data[this.length - 1];
};

/**
 * Perform element-wise equality comparison with another list
 * @param {List} other
 */
List.prototype.equals = function (other) {
    const length = this.length;

    if (length !== other.length) {
        return false;
    }

    let i;

    for (i = 0; i < length; i++) {
        const a = this.get(i);

        const b = other.get(i);

        if (a === b) {
            continue;
        }

        if (typeof a === "object" && typeof b === "object" && typeof a.equals === "function" && a.equals(b)) {
            //test via "equals" method
            continue;
        }

        //elements not equal
        return false;
    }

    return true;
};

export default List;
