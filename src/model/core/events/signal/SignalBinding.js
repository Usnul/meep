/**
 * @author Alex Goldring
 * @copyright Alex Goldring 2018
 */


/**
 *
 * @param {Signal} signal
 * @param {function} handler
 * @param {*} [context]
 * @constructor
 */
function SignalBinding(signal, handler, context) {
    if (typeof handler !== "function") {
        throw new TypeError(`handler must be a function, instead was ${handler}`);
    }

    if (typeof signal !== "object") {
        throw new TypeError(`signal must be of an object, instead was ${signal}`)
    }

    if (typeof signal.add !== "function") {
        throw new TypeError(`signal.add must be a function, instead was ${signal.add}`);
    }

    /**
     * Binding signal
     * @type {Signal}
     */
    this.signal = signal;

    /**
     * Signal handler to be attached to the signal
     * @type {Function}
     */
    this.handler = handler;

    /**
     *
     * @type {*}
     */
    this.context = context;

    /**
     * State flag
     * @type {boolean}
     */
    this.linked = false;
}

/**
 * Attaches handler to the signal
 * Idempotent
 */
SignalBinding.prototype.link = function () {
    if (!this.linked) {
        this.linked = true;
        this.signal.add(this.handler, this.context);
    }
};

/**
 * Detaches handler from the signal
 * Idempotent
 */
SignalBinding.prototype.unlink = function () {
    if (this.linked) {
        this.linked = false;
        this.signal.remove(this.handler, this.context);
    }
};

export {
    SignalBinding
};
