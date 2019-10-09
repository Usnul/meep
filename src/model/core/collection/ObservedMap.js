import Signal from "../events/signal/Signal.js";

/**
 * @template K,V
 * @constructor
 * @property {number} size
 */
function ObservedMap(source = new Map()) {
    this.on = {
        set: new Signal(),
        deleted: new Signal()
    };

    /**
     *
     * @type {Map<K, V>}
     */
    this.data = source;
}

Object.defineProperty(ObservedMap.prototype, "size", {
    get() {
        return this.data.size;
    },
    configurable: false
});

/**
 *
 * @param {K} key
 * @returns {V|undefined}
 */
ObservedMap.prototype.get = function (key) {
    return this.data.get(key);
};
/**
 *
 * @param {K} key
 * @param {V} value
 * @returns {ObservedMap}
 */
ObservedMap.prototype.set = function (key, value) {
    this.data.set(key, value);
    this.on.set.dispatch(key, value);

    return this;
};

/**
 *
 * @param {K} key
 * @returns {boolean}
 */
ObservedMap.prototype.delete = function (key) {
    const result = this.data.delete(key);

    if (result) {
        this.on.deleted.dispatch(key);
    }

    return result;
};

ObservedMap.prototype.forEach = function (callback, thisArg) {
    this.data.forEach(callback, thisArg);
};


export {
    ObservedMap
};
