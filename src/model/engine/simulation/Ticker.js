/**
 * Created by Alex on 06/05/2015.
 */
import Clock from '../../Clock';
import { assert } from "../../core/assert.js";

/**
 *
 * @constructor
 */
function Ticker() {

    /**
     * @readonly
     * @type {Clock}
     */
    this.clock = new Clock();


    this.clock.pause();

    /**
     * @private
     * @type {boolean}
     */
    this.isRunning = false;

    this.callbacks = [];
}

/**
 *
 * @param {function} callback
 */
Ticker.prototype.subscribe = function (callback) {
    assert.equal(typeof callback, 'function', `expected callback to be a function, instead was '${typeof callback}'`);

    this.callbacks.push(callback);
};

Ticker.prototype.start = function ({ maxTimeout = 100 } = {}) {
    const self = this;
    let timeout = null;
    let animationFrame = null;

    this.isRunning = true;

    function update() {
        if (self.isRunning) {
            const delta = self.clock.getDelta();
            self.callbacks.forEach(callback => callback(delta));
        }
    }

    function cycle() {
        update();
    }

    function timeoutCallback() {
        cancelAnimationFrame(animationFrame);
        animate();
    }

    function animationFrameCallback() {
        clearTimeout(timeout);

        //push tick beyond animation frame stack allowing draw to happen
        setTimeout(animate, 0);
    }

    function animate() {
        animationFrame = requestAnimationFrame(animationFrameCallback);
        cycle();
        timeout = setTimeout(timeoutCallback, maxTimeout);
    }

    self.clock.getDelta(); //purge delta
    self.clock.start();

    requestAnimationFrame(animationFrameCallback);
};

Ticker.prototype.pause = function () {
    this.isRunning = false;
};

Ticker.prototype.resume = function () {
    this.isRunning = true;
};

export default Ticker;
