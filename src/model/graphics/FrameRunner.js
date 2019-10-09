/**
 *
 */
export class FrameRunner {
    /**
     *
     * @param {function} action
     */
    constructor(action) {
        /**
         *
         * @type {Function}
         */
        this.action = action;
        /**
         *
         * @type {boolean}
         */
        this.running = false;
        /**
         *
         * @type {number}
         */
        this.animationFrameId = -1;
    }

    /**
     *
     * @returns {boolean}
     */
    startup() {
        if (this.running) {
            return false;
        }

        console.warn("FrameFunner.started");

        this.running = true;

        const self = this;

        const action = this.action;

        function cycle() {
            if (!self.running) {
                //not supposed to be running, bail
                return;
            }

            action();

            self.animationFrameId = requestAnimationFrame(cycle);
        }

        self.animationFrameId = requestAnimationFrame(cycle);

        return true;
    }

    /**
     *
     * @returns {boolean}
     */
    shutdown() {
        if (!this.running) {
            return false;
        }

        console.warn("FrameFunner.stopped");

        this.running = false;
        cancelAnimationFrame(this.animationFrameId);

        this.animationFrameId = -1;

        return true;
    }

    /**
     *
     * @returns {boolean}
     */
    isRunning() {
        return this.running;
    }
}
