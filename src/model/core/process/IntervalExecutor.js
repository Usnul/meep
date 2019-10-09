/**
 * Created by Alex on 22/05/2016.
 */

/**
 *
 * @param {number} quietTime in milliseconds
 * @param {number} workTime in milliseconds
 * @constructor
 */
function IntervalExecutor(quietTime, workTime) {
    this.quietTime = quietTime;
    this.workTime = workTime;
    this.tasks = [];
    this.busy = false;
    this.timeLastWorkDone = 0;
}

/**
 *
 * @param {function} task
 */
IntervalExecutor.prototype.add = function (task) {
    this.tasks.push(task);
    this.prod();
};

IntervalExecutor.prototype.prod = function () {
    const self = this;
    const tasks = this.tasks;

    function processCycle() {
        const t = Date.now();
        let timeNow = t;

        let workTime = 0;

        while (tasks.length > 0) {
            const task = tasks.shift();
            task();

            timeNow = Date.now();
            workTime = timeNow - t;
            if (workTime >= self.workTime) {
                //time slice ended
                break;
            }
        }

        self.timeLastWorkDone = timeNow;

        if (tasks.length > 0) {
            //compute adaptive quiet time based on how long we worked for
            const workOverBudget = workTime - self.workTime;
            const sleepTime = self.quietTime + Math.max(workOverBudget, 0);

            //still some tasks left, schedule next slice
            setTimeout(processCycle, sleepTime);
        } else {
            //all tasks done, reset the 'busy' flag
            self.busy = false;
        }
    }

    if (!this.busy && tasks.length > 0) {
        this.busy = true;
        const timeSinceLastWork = Date.now() - this.timeLastWorkDone;
        const quietTimeDelta = this.quietTime - timeSinceLastWork;
        if (quietTimeDelta < 0) {
            processCycle();
        } else {
            setTimeout(processCycle, quietTimeDelta);
        }
    }
};


export default IntervalExecutor;