/**
 * Created by Alex on 19/08/2016.
 */


/**
 *
 * @enum {number}
 */
export const FutureStates = {
    INITIAL: 0,
    PENDING: 1,
    RESOLVED: 2,
    REJECTED: 3
};

function fastForEach(array, callback) {
    let i = 0;
    const l = array.length;
    for (; i < l; i++) {
        callback(array[i]);
    }
}

/**
 * @template T
 * @param {function(resolve:function(T), reject:function(reason))} resolver
 * @constructor
 * @extends Promise<T>
 * @class
 */
function Future(resolver) {
    this.resolver = resolver;
    this.state = FutureStates.INITIAL;

    this.callbacksRejection = [];
    this.rejectionReason = null;

    this.callbacksResolution = [];
    this.resolvedValue = null;
}

/**
 *
 * @param reason
 * @private
 */
Future.prototype.__handleRejection = function (reason) {
    this.state = FutureStates.REJECTED;
    this.rejectionReason = reason;
    fastForEach(this.callbacksRejection, function (cb) {
        cb(reason);
    });
    //clear callbacks
    this.__clearCallbacks();
};

/**
 *
 * @private
 */
Future.prototype.__clearCallbacks = function () {
    this.callbacksRejection = [];
    this.callbacksResolution = [];
};
/**
 *
 * @private
 */
Future.prototype.__handleResolution = function (v) {
    this.state = FutureStates.RESOLVED;

    this.resolvedValue = v;

    fastForEach(this.callbacksResolution, function (cb) {
        cb(v);
    });

    //clear callbacks
    this.__clearCallbacks();
};

Future.prototype.resolve = function () {
    const self = this;

    function handleRejection(reason) {
        self.__handleRejection(reason);
    }

    function handleResolution(v) {
        self.__handleResolution(v);
    }

    if (this.state === FutureStates.INITIAL) {
        this.state = FutureStates.PENDING;
        try {
            this.resolver(handleResolution, handleRejection);
        } catch (error) {
            handleRejection(error);
        }
    }
};

/**
 *
 * @param {function} resolvedCallback
 * @param {function} [rejectionCallback]
 */
Future.prototype.then = function (resolvedCallback, rejectionCallback) {
    if (this.state === FutureStates.RESOLVED) {
        resolvedCallback(this.resolvedValue);
    } else if (this.state === FutureStates.REJECTED) {
        if (typeof rejectionCallback === "function") {
            rejectionCallback(this.rejectionReason);
        } else {
            console.error(`Uncaught Future rejection: ${this.rejectionReason}`);
        }
    } else {
        this.callbacksResolution.push(resolvedCallback);
        if (typeof rejectionCallback === 'function') {
            this.callbacksRejection.push(rejectionCallback);
        }
    }
};

/**
 *
 * @param {function} rejectionCallback
 */
Future.prototype.catch = function (rejectionCallback) {
    if (this.state === FutureStates.REJECTED) {
        rejectionCallback(this.rejectionReason);
    } else if (this.state !== FutureStates.RESOLVED) {
        this.callbacksRejection.push(rejectionCallback);
    }
};

export default Future;