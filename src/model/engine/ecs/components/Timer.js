/**
 * User: Alex Goldring
 * Date: 17/6/2014
 * Time: 21:43
 */


/**
 *
 * @param options
 * @constructor
 * @property {number} repeat
 * @property {number} timeout
 * @property {Array.<function>} actions
 * @property {boolean} active
 */
function Timer(options = {}) {
    this.repeat = options.repeat !== void 0 ? options.repeat : 0;
    this.timeout = options.timeout;
    this.actions = options.actions || [];
    this.active = true;
    this.ticks = 0;

    /**
     * represents current time elapsed in a cycle, always less than timeout value
     * @type {number}
     */
    this.counter = 0;
}

Timer.typeName = "Timer";
Timer.serializable = false;

export default Timer;
