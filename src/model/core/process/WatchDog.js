/**
 *
 * @param {function} action
 * @constructor
 */
function WatchDog(action) {
    /**
     *
     * @type {Function}
     */
    this.action = action;

    this.timeoutId = -1;

    this.timeout = 0;

    this.__timeLastKicked = 0;

    const self = this;
    this.bark = function () {
        self.action();
        //
        this.timeoutId = -1;
    };
}

WatchDog.prototype.start = function () {
    console.warn(`WatchDog.start`);

    if (this.isActive()) {
        //do nothing
    } else {
        this.timeoutId = setTimeout(this.bark, this.timeout);
        this.__timeLastKicked = Date.now();
    }
};

WatchDog.prototype.stop = function () {
    console.warn(`WatchDog.stop`);

    if (this.isActive()) {
        clearTimeout(this.timeoutId);
        this.timeoutId = -1;
    } else {
        //do nothing, no active timeout
    }
};

/**
 *
 * @returns {boolean}
 */
WatchDog.prototype.isActive = function () {
    return this.timeoutId !== 0;
};

/**
 *
 */
WatchDog.prototype.kick = function () {
    // const timeLastKicked = this.__timeLastKicked;

    this.__timeLastKicked = Date.now();

    // const delta = timeNow - timeLastKicked;

    //TODO: remember callstack

    // console.warn(`WatchDog.kick. ${delta}ms since last`);

    if (this.isActive()) {
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(this.bark, this.timeout);
    } else {
        throw new Error(`WatchDog is not active`);
    }
};

/**
 *
 * @param {number} delay in milliseconds
 */
WatchDog.prototype.setTimeout = function (delay) {
    this.timeout = delay;
};

export { WatchDog };