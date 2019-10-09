/**
 * Created by Alex on 21/05/2016.
 */


/**
 *
 * @param {Worker} worker
 * @param {*} message
 * @return {boolean} true if sending was successful, false otherwise
 */
function trySendMessage(worker, message) {
    try {
        worker.postMessage(message);
        return true;
    } catch (e) {
        //request failed
        console.error("failed to send message: ", message, e);
        return false;
    }
}

function needsSerialization(value) {
    if (typeof value !== "object") {
        return false;
    }

    if (value.hasOwnProperty('toJSON') && value.toJSON === "function") {
        return true;
    }

    return false;
}

function generateAPI(target, methods) {
    function makeMethod(name) {
        const pending = target.__pending[name] = [];
        target[name] = function () {
            const argumentCount = arguments.length;

            const parameters = new Array(argumentCount);

            for (let i = 0; i < argumentCount; i++) {
                const argument = arguments[i];
                if (needsSerialization(argument)) {
                    //use toJSON method on an argument if possible
                    parameters[i] = argument.toJSON();
                } else {
                    parameters[i] = argument;
                }
            }

            return new Promise(function (resolve, reject) {
                const request = {
                    parameters: parameters,
                    resolve: resolve,
                    reject: reject
                };

                pending.push(request);

                if (target.isRunning()) {
                    const message = {
                        methodName: name,
                        parameters: parameters
                    };

                    if (!trySendMessage(target.__worker, message)) {
                        //failed to send message
                        //drop pending request
                        pending.splice(pending.indexOf(request), 1);
                    }
                }
            });
        };
    }

    for (let methodName in methods) {
        if (methods.hasOwnProperty(methodName)) {
            makeMethod(methodName);
        }
    }
}

const WorkerProxy = function (url, methods) {
    this.url = url;
    this.methods = methods;

    this.__pending = [];
    this.__isRunning = false;
    this.__worker = null;
    //
    const pending = this.__pending;

    generateAPI(this, methods);

    this.__handleMessage = function (event) {
        const data = event.data;
        const methodName = data.methodName;
        //find pending request queue for method
        const requestQueue = pending[methodName];
        if (requestQueue === undefined) {
            throw new Error('Unexpected method \'' + methodName + '\'');
        } else {
            const response = requestQueue.shift();
            if (data.hasOwnProperty('error')) {
                response.reject(data.error);
            } else {
                response.resolve(data.result);
            }
        }
    };
};

WorkerProxy.prototype.isRunning = function () {
    return this.__isRunning;
};

WorkerProxy.prototype.stop = function () {
    if (!this.__isRunning) {
        //not running
        return;
    }
    this.__worker.terminate();
    this.__isRunning = false;
};

WorkerProxy.prototype.sendPendingRequests = function () {
    for (let methodName in this.__pending) {
        if (this.__pending.hasOwnProperty(methodName)) {
            const pending = this.__pending[methodName];
            for (let i = 0; i < pending.length; i++) {
                const request = pending[i];
                const message = {
                    methodName: methodName,
                    parameters: request.parameters
                };

                trySendMessage(this.__worker, message);
            }
        }
    }
};

WorkerProxy.prototype.start = function () {
    if (this.__isRunning) {
        //already running
        return;
    }

    this.__worker = new Worker(this.url);
    this.__worker.onmessage = this.__handleMessage;
    this.__isRunning = true;

    this.sendPendingRequests();
};

export default WorkerProxy;