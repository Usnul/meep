/**
 * Created by Alex on 29/06/2017.
 */


import Signal from '../events/signal/Signal.js';

/**
 * List structure with event signals for observing changes.
 * @param {Array.<T>} [array=[]]
 * @template T
 * @constructor
 * @property {{added: Signal, removed: Signal}} on
 */
const Set = function (array) {
    this.on = {
        added: new Signal(),
        removed: new Signal()
    };
    this.data = [];

    this.length = 0;

    if (array !== undefined) {
        this.addAll(array);
    }
};

/**
 *
 * @param {T} el
 */
Set.prototype.contains = function (el) {
    return this.data.indexOf(el) !== -1;
};

/**
 *
 * @param {T} el
 */
Set.prototype.add = function (el) {
    if (!this.contains(el)) {
        this.data.push(el);
        this.length++;
        this.on.added.dispatch(el);
    }
};

/**
 *
 * @param {T} el
 */
Set.prototype.remove = function (el) {
    const index = this.data.indexOf(el);
    if (index !== -1) {
        this.__removeByIndex(index, el);
    }
};

/**
 *
 * @param {Number} index
 * @param {T} el
 * @private
 */
Set.prototype.__removeByIndex = function (index, el) {
    this.data.splice(index, 1);
    this.length--;
    this.on.removed.dispatch(el);
};

/**
 *
 * @param {Array.<T>} elements
 */
Set.prototype.addAll = function (elements) {
    for (let i = 0, l = elements.length; i < l; i++) {
        this.add(elements[i]);
    }
};

/**
 * Performs a diff on the set and provided collection, elements in the set but not in input are removed and elements in the input but not in the set are added.
 * @param {Array.<T>} source
 */
Set.prototype.setFromArray = function (source) {
    const data = this.data;

    const sourceCopy = source.slice();

    for (let i = data.length - 1; i >= 0; i--) {
        const element = data[i];
        const sourceIndex = sourceCopy.indexOf(element);
        if (sourceIndex === -1) {
            //element is in the set currently, but not in the collection which we are trying to copy
            this.__removeByIndex(i, element);
        } else {
            //source element is already in the set
            sourceCopy.splice(sourceIndex, 1);
        }
    }

    //add the rest to selection
    for (let i = 0, l = sourceCopy.length; i < l; i++) {
        this.add(sourceCopy[i]);
    }
};

/**
 *
 * @param {function(el:T)} visitor
 */
Set.prototype.forEach = function (visitor) {
    for (let i = 0; i < this.length; i++) {
        visitor(this.data[i]);
    }
};

/**
 *
 * @param {[]} a
 * @param {[]} b
 * @returns {{uniqueA:[], uniqueB:[], common:[]}}
 */
export function arraySetDiff(a, b) {
    const uniqueA = a.slice();
    const uniqueB = b.slice();

    const common = [];

    let lA = uniqueA.length;

    let i;
    for (i = 0; i < lA; i++) {
        const elA = uniqueA[i];

        const j = uniqueB.indexOf(elA);

        if (j !== -1) {
            common.push(elA);

            uniqueA.splice(i, 1);
            uniqueB.splice(j, 1);

            i--;
            lA--;
        }
    }

    return {
        uniqueA,
        uniqueB,
        common
    };
}

export default Set;
