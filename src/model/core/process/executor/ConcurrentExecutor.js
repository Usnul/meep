/**
 * Created by Alex on 22/05/2016.
 */
import Signal from '../../events/signal/Signal.js';
import TaskState from '../task/TaskState';
import TaskSignal from '../task/TaskSignal';


/**
 * @class
 */
class ConcurrentExecutor {
    /**
     *
     * @param {number} quietTime in milliseconds
     * @param {number} workTime in milliseconds
     * @constructor
     */
    constructor(quietTime, workTime) {
        /**
         *
         * @type {number}
         */
        this.quietTime = quietTime;
        /**
         *
         * @type {number}
         */
        this.workTime = workTime;

        /**
         * Tasks in state pending resolution or initial sate are put here
         * @type {Task[]}
         */
        this.queueUnresolved = [];

        /**
         * ready tasks are those who's dependencies have all been completed
         * @type {Task[]}
         */
        this.queueReady = [];

        this.on = {
            completed: new Signal()
        };

        /**
         *
         * @type {number|SchedulingPolicy}
         */
        this.policy = SchedulingPolicy.ROUND_ROBIN;
    }

    /**
     *
     * @param {TaskGroup} taskGroup
     */
    runGroup(taskGroup) {
        const self = this;

        const children = taskGroup.children;
        const numChildren = children.length;
        let pendingCount = numChildren;

        let resolved = false;

        function signalSuccess() {
            if (!resolved) {
                resolved = true;

                taskGroup.state.set(TaskState.SUCCEEDED);
                taskGroup.on.completed.dispatch();

                self.prod();
            }
        }

        function signalFailure(reason) {
            if (!resolved) {
                resolved = true;

                taskGroup.state.set(TaskState.FAILED);
                taskGroup.on.failed.dispatch(reason);

                self.prod();
            }
        }

        function subTaskCompleted() {
            pendingCount--;
            if (pendingCount <= 0) {
                signalSuccess();
            }
        }

        function subTaskFailed(reason) {
            signalFailure(reason);
        }

        function isGroup(t) {
            return t.children instanceof Array;
        }

        if (numChildren > 0) {
            taskGroup.state.set(TaskState.RUNNING);
            let i = 0;
            for (; i < numChildren; i++) {
                const child = children[i];
                child.on.completed.add(subTaskCompleted);
                child.on.failed.add(subTaskFailed);
                if (isGroup(child)) {
                    this.runGroup(child);
                } else {
                    this.run(child);
                }
            }
        } else {
            //no children, succeed immediately
            signalSuccess();
        }
    }

    /**
     *
     * @param {Task} task
     * @return {boolean}
     */
    removeTask(task) {
        //console.warn("Removing task:", task);

        const readyIndex = this.queueReady.indexOf(task);

        if (readyIndex !== -1) {
            //is in ready queue, remove
            this.queueReady.splice(readyIndex, 1);
            return true;
        }

        const unresolvedIndex = this.queueUnresolved.indexOf(task);

        if (unresolvedIndex !== -1) {
            //found in unresolved queue, remove
            this.queueUnresolved.splice(unresolvedIndex, 1);

            return true;
        }

        //not found
        return false;
    }

    /**
     *
     * @param {Task} task
     */
    run(task) {
        this.queueUnresolved.push(task);
        this.prod();
    }

    /**
     * Shortcut for {@link #run} method for scheduling multiple tasks at once
     * @param {Task[]} tasks
     */
    runMany(tasks) {
        Array.prototype.push.apply(this.queueUnresolved, tasks);

        this.prod();
    }

    /**
     * @private
     * @param {Task} task
     * @returns {boolean}
     */
    startTask(task) {
        try {
            task.initialize(task, this);
        } catch (e) {
            console.error(`Task initialization failed`, task, e);

            task.state.set(TaskState.FAILED);

            task.on.failed.dispatch(e);

            return false;
        }

        // console.log("Starting task", task);

        task.state.set(TaskState.RUNNING);

        //dispatch start notification
        task.on.started.dispatch(this);

        //add to the queue
        this.queueReady.push(task);

        return true;
    }

    /**
     * Go through unresolved queue and move tasks who's dependencies have been completed to ready queue or fail them
     */
    resolveTasks() {
        const queueUnresolved = this.queueUnresolved;

        let i = 0, l = queueUnresolved.length;
        for (; i < l; i++) {
            const unresolvedTask = queueUnresolved[i];
            const resolution = tryResolve(unresolvedTask);
            switch (resolution) {
                case ResolutionType.READY:
                    //remove task from unresolved queue to prevent infinite recursion in case "resolveTasks" is attempted again inside task initializer
                    queueUnresolved.splice(i, 1);

                    //set state of task to READY
                    unresolvedTask.state.set(TaskState.READY);

                    //attempt to start the task
                    this.startTask(unresolvedTask);

                    //task start could have altered unresolved queue, re-initialize iteration
                    i = 0;
                    l = queueUnresolved.length;

                    break;
                case ResolutionType.FAILED:
                    queueUnresolved.splice(i, 1);
                    l--;
                    i--;
                    break;
            }
        }
    }

    /**
     *
     * @param {Task} task
     */
    contains(task) {
        if (this.queueUnresolved.indexOf(task) !== -1) {
            return true;
        }

        if (this.queueReady.indexOf(task) !== -1) {
            return true;
        }

        return false;
    }

    /**
     * kicks the scheduler into action, this is an internal method and should not be called from outside
     * @private
     */
    prod() {
        const self = this;

        let i = 0;

        this.resolveTasks();

        const readyTasks = this.queueReady;
        let readyTaskCount;

        function updateTaskCount() {
            readyTaskCount = readyTasks.length;
        }

        function pickNextTaskRoundRobin() {
            return readyTasks[i++ % readyTaskCount];
        }

        function pickNextTaskSequential() {
            return readyTasks[0];
        }

        /**
         * @type {function():Task}
         */
        let pickNextTask;

        switch (this.policy) {
            case ConcurrentExecutor.POLICY.ROUND_ROBIN:
                pickNextTask = pickNextTaskRoundRobin;
                break;
            case ConcurrentExecutor.POLICY.SEQUENTIAL:
                pickNextTask = pickNextTaskSequential;
                break;
            default:
                console.warn('Unknown scheduling policy: ', this.policy, 'Defaulting to sequential');
                pickNextTask = pickNextTaskSequential;
                break;
        }

        /**
         *
         * @param {Task} task
         */
        function completeTask(task) {

            const taskIndex = readyTasks.indexOf(task);

            if (taskIndex !== -1) {
                readyTasks.splice(taskIndex, 1);
            } else {
                console.error("Failed to remove ready task, not found in the ready queue", task, readyTasks.slice());
            }


            task.state.set(TaskState.SUCCEEDED);
            task.on.completed.dispatch();

            self.resolveTasks();
            updateTaskCount();
        }

        /**
         *
         * @param {Task} task
         * @param {*} reason
         */
        function failTask(task, reason) {
            const taskIndex = readyTasks.indexOf(task);

            if (taskIndex !== -1) {
                readyTasks.splice(taskIndex, 1);
            } else {
                console.error("Failed to remove ready task, not found in the ready queue", task, readyTasks.slice());
            }

            task.state.set(TaskState.FAILED);
            task.on.failed.dispatch(reason);

            self.resolveTasks();
            updateTaskCount();
        }

        function executeTimeSlice() {
            let sliceTimeLeft = self.workTime;

            let executionTime = 0;

            while (readyTaskCount > 0) {
                const task = pickNextTask();

                if (task === undefined) {
                    console.warn('Next task not found, likely result of removing task mid-execution');
                    break;
                }

                try {
                    executionTime = runTaskForTime2(task, sliceTimeLeft, completeTask, failTask);
                } catch (e) {
                    console.error(`Task threw an exception`, task, e);
                    failTask(task, e);
                }

                //make sure that execution time that we subtract from current CPU slice is always reducing the slice
                sliceTimeLeft -= Math.max(executionTime, 1);

                if (sliceTimeLeft <= 0) {
                    break;
                }
            }

            //update task count
            updateTaskCount();

            if (readyTaskCount > 0) {
                //schedule next time slice
                setTimeout(executeTimeSlice, self.quietTime);
            } else {
                self.busy = false;
                self.on.completed.dispatch();
            }
        }

        updateTaskCount();

        if (!this.busy && readyTaskCount > 0) {
            this.busy = true;
            executeTimeSlice();
        }

    }

    join(callback) {
        if (this.queueReady.length === 0 && this.queueUnresolved.length === 0) {
            callback();
        } else {
            this.on.completed.addOne(callback);
        }
    }
}

/**
 * @readonly
 * @enum {number}
 */
const SchedulingPolicy = {
    ROUND_ROBIN: 0,
    SEQUENTIAL: 1,
    TIME_SLICE: 2
};

ConcurrentExecutor.POLICY = SchedulingPolicy;

/**
 *
 * @param {Task} task
 * @param {number} time in milliseconds
 * @param {function} completionCallback
 * @param {function} failureCallback
 */
function runTaskForTime2(task, time, completionCallback, failureCallback) {
    let i = 0;

    /**
     *
     * @type {function(): TaskSignal}
     */
    const cycle = task.cycle;

    const startTime = performance.now();

    const endTime = startTime + time;

    let t = startTime;
    let signal;

    while (t < endTime) {
        i++;

        signal = cycle();
        t = performance.now();

        if (signal === TaskSignal.Continue) {
            continue;
        }

        if (signal === TaskSignal.Yield) {
            //give up current quanta
            break;
        }

        if (signal === TaskSignal.EndSuccess) {
            break;
        } else if (signal === TaskSignal.EndFailure) {
            break;
        } else {
            throw new Error("Task produced unknown signal: " + signal);
        }
    }

    const executionDuration = t - startTime;

    task.__executedCpuTime += executionDuration;
    task.__executedCycleCount += i;

    if (signal === TaskSignal.EndSuccess) {
        completionCallback(task);
    } else if (signal === TaskSignal.EndFailure) {
        failureCallback(task, "Task signalled failure");
    }

    return executionDuration;
}

const ResolutionType = {
    READY: 0,
    FAILED: 1,
    UNRESOLVED: 2
};

/**
 *
 * @param {Task} unresolvedTask
 * @returns {number}
 */
function tryResolve(unresolvedTask) {
    const dependencies = unresolvedTask.dependencies;
    let j = 0;
    const jl = dependencies.length;
    for (; j < jl; j++) {
        const dependency = dependencies[j];
        switch (dependency.state.getValue()) {
            case TaskState.INITIAL:
            case TaskState.RUNNING:
            case TaskState.READY:
                return ResolutionType.UNRESOLVED;
            case TaskState.SUCCEEDED:
                break;
            default:
                console.error("Unknown dependency task state", dependency.state, "dependency:", dependency, "dependant:", unresolvedTask, "Failing the task.");
            //intended fallthrough
            case TaskState.FAILED:
                //fail dependant task
                return ResolutionType.FAILED;
        }
    }

    return ResolutionType.READY;
}

export default ConcurrentExecutor;
