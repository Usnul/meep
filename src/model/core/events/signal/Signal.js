/**
 *
 * @author Alex Goldring
 * @copyright Alex Goldring 2014
 */


import { assert } from "../../assert.js";
import { SignalHandler, SignalHandlerFlags } from "./SignalHandler.js";


/**
 * Event dispatcher dedicated to single event type
 * @constructor
 */
const Signal = function () {
    /**
     *
     * @type {boolean}
     */
    this.silent = false;
    /**
     *
     * @type {boolean}
     */
    this.dispatching = false;

    /**
     * @private
     * @type {SignalHandler[]}
     */
    this.handlers = [];

    /**
     * @type {Array}
     * @private
     */
    this.__temp = [];
};

/**
 *
 * @param {function} h
 * @returns {boolean}
 */
Signal.prototype.contains = function (h) {
    const handlers = this.handlers;

    const i = findSignalHandlerIndexByHandle(handlers, h);

    return i !== -1;
};

Signal.prototype.mute = function () {
    this.silent = true;
};

Signal.prototype.unmute = function () {
    this.silent = false;
};

/**
 * Tells if there are any handlers attached to the signal or not
 * @returns {boolean}
 */
Signal.prototype.hasHandlers = function () {
    return this.handlers.length > 0;
};

/**
 *
 * @param {function} h
 * @param {*} [context]
 */
Signal.prototype.addOne = function (h, context) {
    assert.equal(typeof h, "function", "Handler is not a function");

    const handler = new SignalHandler(h, context);

    handler.setFlag(SignalHandlerFlags.RemoveAfterExecution);

    this.handlers.push(handler);
};

/**
 *
 * @param {function} h
 * @param {*} [context]
 */
Signal.prototype.add = function (h, context) {
    assert.typeOf(h, "function", "handler");

    if (!ENV_PRODUCTION) {
        if (this.handlers.length + 1 === 100) {
            console.error(`Number of handlers has is 100 now, possible leak detected`);
        }
    }

    const handler = new SignalHandler(h, context);

    this.handlers.push(handler);
};

/**
 *
 * @param {SignalHandler[]} handlers
 * @param {function} f
 * @returns {number} index of the handler, or -1 if not found
 */
export function findSignalHandlerIndexByHandle(handlers, f) {
    const l = handlers.length;

    for (let i = 0; i < l; i++) {
        const signalHandler = handlers[i];

        if (signalHandler.handle === f) {
            return i;
        }
    }

    return -1;
}

/**
 *
 * @param {SignalHandler[]} handlers
 * @param {function} f
 * @param {*} ctx
 * @returns {number} index of the handler, or -1 if not found
 */
export function findSignalHandlerIndexByHandleAndContext(handlers, f, ctx) {
    const l = handlers.length;

    for (let i = 0; i < l; i++) {
        const signalHandler = handlers[i];

        if (signalHandler.handle === f && signalHandler.context === ctx) {
            return i;
        }
    }

    return -1;
}

/**
 *
 * @param {Signal} signal
 * @param {function} h
 * @returns {boolean}
 */
function removeHandlerByHandler(signal, h) {
    const handlers = signal.handlers;
    let i = findSignalHandlerIndexByHandle(handlers, h);

    if (i >= 0) {
        handlers.splice(i, 1);
        return true;
    }

    return false;
}

/**
 *
 * @param {Signal} signal
 * @param {function} h
 * @param {*} ctx
 * @returns {boolean}
 */
function removeHandlerByHandlerAndContext(signal, h, ctx) {
    const handlers = signal.handlers;
    let i = findSignalHandlerIndexByHandleAndContext(handlers, h, ctx);

    if (i >= 0) {
        handlers.splice(i, 1);
        return true;
    }

    return false;
}

/**
 *
 * @param {function} h
 * @param {*} [thisArg] if supplied, will match handlers with a specific context only
 * @returns {boolean} true if a handler was removed, false otherwise
 */
Signal.prototype.remove = function (h, thisArg) {
    assert.typeOf(h, "function", "handler");

    if (thisArg === undefined) {
        return removeHandlerByHandler(this, h);
    } else {
        return removeHandlerByHandlerAndContext(this, h, thisArg);
    }
};

function dispatchCallback(f, context, args) {
    assert.typeOf(f, 'function', 'f');

    try {
        f.apply(context, args)
    } catch (e) {
        console.error("Failed to dispatch handler", f, e);
    }
}

/**
 *
 * @param {SignalHandler[]} handlers
 * @param {SignalHandler[]} proxy
 * @param {Array} [args]
 */
export function dispatchViaProxy(handlers, proxy, args) {

    const length = handlers.length;

    let i, h;
    for (i = 0; i < length; i++) {
        //copy to proxy
        proxy[i] = handlers[i];
    }

    for (i = length - 1; i >= 0; i--) {
        h = proxy[i];

        if (h.getFlag(SignalHandlerFlags.RemoveAfterExecution)) {
            //handler should be cut
            const p = handlers.indexOf(h);
            handlers.splice(p, 1);
        }

        dispatchCallback(h.handle, h.context, args);
    }

    //clear out
    proxy.lenght = 0;
}

/**
 * @param {...*} args
 */
Signal.prototype.dispatch = function (...args) {
    if (this.silent) {
        //don't dispatch any events while silent
        return;
    }

    //mark dispatch process
    this.dispatching = true;

    dispatchViaProxy(this.handlers, this.__temp, args);

    //mark end of dispatch process
    this.dispatching = false;
};

/**
 * dispatch without a value.
 * Allows JS engine to optimize for monomorphic call sites
 */
Signal.prototype.send0 = function () {
    //TODO implement actual monomorphic call
    this.dispatch();
};

/**
 * dispatch with a single value.
 * Allows JS engine to optimize for monomorphic call sites
 * @param {*} arg
 */
Signal.prototype.send1 = function (arg) {
    //TODO implement actual monomorphic call
    this.dispatch(arg);
};

/**
 *
 * @param {*} a
 * @param {*} b
 */
Signal.prototype.send2 = function (a, b) {
    //TODO implement actual monomorphic call
    this.dispatch(a, b);
};

/**
 *
 * @param {*} a
 * @param {*} b
 * @param {*} c
 */
Signal.prototype.send3 = function (a, b, c) {
    //TODO implement actual monomorphic call
    this.dispatch(a, b, c);
};

/**
 *
 * @param {*} a
 * @param {*} b
 * @param {*} c
 * @param {*} d
 */
Signal.prototype.send4 = function (a, b, c, d) {
    if (this.silent) {
        //don't dispatch any events while silent
        return;
    }

    const handlers = this.handlers;

    const length = handlers.length;

    const proxy = this.__temp;

    let i, h;

    // Copy handlers into a temp storage to preserve state during dispatch
    for (i = 0; i < length; i++) {
        //copy to proxy
        proxy[i] = handlers[i];
    }

    // Dispatch phase
    for (i = length - 1; i >= 0; i--) {
        h = proxy[i];

        if (h.getFlag(SignalHandlerFlags.RemoveAfterExecution)) {
            //handler should be cut
            const p = handlers.indexOf(h);
            handlers.splice(p, 1);
        }

        const f = h.handle;

        try {
            f.call(h.context, a, b, c, d)
        } catch (e) {
            console.error("Failed to dispatch handler", f, e);
        }

    }

    //clear out temp storage
    proxy.lenght = 0;
};

/**
 *
 * @returns {boolean}
 */
Signal.prototype.isDispatching = function () {
    return this.dispatching;
};

/**
 *
 * @param {Signal} other
 * @returns {Signal} merged signal combining events from this and other
 */
Signal.prototype.merge = function (other) {
    const result = new Signal();

    function handler() {
        result.dispatch(arguments);
    }

    this.add(handler);
    other.add(handler);

    return result;
};

/**
 * @readonly
 * @type {boolean}
 */
Signal.prototype.isSignal = true;

export default Signal;
