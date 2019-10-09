/**
 * Created by Alex on 03/11/2016.
 */


import WorkerBuilder from '../../core/process/worker/WorkerBuilder';

function buildWorker() {
    const workerBuilder = new WorkerBuilder();
    workerBuilder.importScript('lib/lzma_worker.js');

    workerBuilder.addMethod('encode', function encode(data, level) {
        return new Promise(function (resolve, reject) {
            //Validate data type
            if (typeof data !== "string" && !(data instanceof Uint8Array)) {
                reject("data must be a string or a Uint8Array, instead got '" + (typeof data) + "'");
            }

            let compressionLevel;
            if (typeof level === 'number') {
                if (level < 1) {
                    compressionLevel = 1;
                    console.warn('Requested compression level(' + level + ') < minimum(1), using 1 instead');
                } else if (level > 9) {
                    compressionLevel = 9;
                    console.warn('Requested compression level(' + level + ') > maximum(9), using 9 instead');
                } else if (level % 1 !== 0) {
                    compressionLevel = level | 0;
                    console.warn('Requested compression level(' + level + ') is not integer, using ' + compressionLevel + ' instead');
                } else {
                    compressionLevel = level;
                }
            } else {
                if (level !== undefined && typeof level !== 'number') {
                    console.warn('Supplied compression level must be a number, was ' + (typeof level) + ' instead. Defaulting to minimum(1)');
                }
                //no valid compression level specified
                compressionLevel = 1;
            }

            console.time("Compression");
            LZMA.compress(data, compressionLevel, function on_finish(result, error) {
                console.timeEnd("Compression");
                if (error) {
                    reject(error);
                } else {
                    if (result instanceof Array) {
                        resolve(new Uint8Array(result));
                    } else {
                        resolve(result);
                    }
                }
            }, function on_progress(percent) {
            });
        });
    });

    workerBuilder.addMethod('decode', function decode(data) {
        return new Promise(function (resolve, reject) {
            LZMA.decompress(data, function on_finish(result, error) {
                if (error) {
                    reject(error);
                } else {
                    if (result instanceof Array) {
                        resolve(new Uint8Array(result));
                    } else {
                        resolve(result);
                    }
                }
            }, function on_progress(percent) {
            });
        });
    });
    return workerBuilder.build();
}

/**
 * @property {WorkerProxy} __workerProxy
 * @property {number} __requestCount
 * @constructor
 */
const CompressionService = function () {
    this.__workerProxy = buildWorker();
    this.__requestCount = 0;
};

/**
 *
 * @param {Promise} r
 * @private
 */
CompressionService.prototype.__incrementRequestCount = function (r) {
    this.__requestCount++;


    const self = this;

    function d() {
        self.__decrementRequestCount();
    }

    r.then(d, d);

    if (!this.__workerProxy.isRunning()) {
        this.__workerProxy.start();
    }
};

/**
 *
 * @private
 */
CompressionService.prototype.__decrementRequestCount = function () {
    this.__requestCount--;
    if (this.__requestCount <= 0 && this.__workerProxy.isRunning()) {
        this.__workerProxy.stop();
    }
};

/**
 *
 * @param data
 * @param level
 * @returns {Promise}
 */
CompressionService.prototype.encode = function (data, level) {
    const result = this.__workerProxy.encode(data, level);
    this.__incrementRequestCount(result);
    return result;
};

/**
 *
 * @param data
 * @returns {Promise}
 */
CompressionService.prototype.decode = function (data) {
    const result = this.__workerProxy.decode(data);
    this.__incrementRequestCount(result);
    return result;
};


export default CompressionService;