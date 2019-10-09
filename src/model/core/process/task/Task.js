/**
 * Created by Alex on 22/05/2016.
 */


import Signal from '../../events/signal/Signal.js';
import TaskState from './TaskState';
import { assert } from "../../assert";
import { noop, returnZero } from "../../function/Functions.js";
import TaskSignal from "./TaskSignal.js";
import ObservedInteger from "../../model/ObservedInteger.js";


/**
 *
 * @param {string} name
 * @param {function(Task, executor:*)} [initializer]
 * @param {function():TaskSignal} cycleFunction
 * @param {function():number} [computeProgress]
 * @param {Task[]} [dependencies=[]]
 * @param {number} [estimatedDuration=1]
 * @constructor
 */
function Task(
    {
        name,
        initializer = noop,
        cycleFunction,
        computeProgress = returnZero,
        dependencies = [],
        estimatedDuration = 1
    }
) {

    assert.notEqual(cycleFunction, undefined, 'cycleFunction was undefined');
    assert.equal(typeof cycleFunction, "function", `cycleFunction must be of type 'function', instead was '${typeof cycleFunction}'`);

    this.dependencies = dependencies;

    this.estimatedDuration = estimatedDuration;

    /**
     *
     * @type {string}
     */
    this.name = name;

    /**
     *
     * @type {function(): TaskSignal}
     */
    this.cycle = cycleFunction;

    /**
     *
     * @type {function(Task, executor:{run:function(Task)})}
     */
    this.initialize = initializer;

    this.computeProgress = computeProgress;

    this.on = {
        started: new Signal(),
        completed: new Signal(),
        failed: new Signal()
    };

    /**
     *
     * @type {ObservedInteger}
     */
    this.state = new ObservedInteger(TaskState.INITIAL);

    /**
     * amount of time spent running this task
     * @type {number}
     * @public
     */
    this.__executedCpuTime = 0;
    /**
     * number of time task's cycle function was executed
     * @type {number}
     * @public
     */
    this.__executedCycleCount = 0;
}

/**
 * Time in milliseconds that the task has been executing for, suspended time does not count
 * @returns {number}
 */
Task.prototype.getExecutedCpuTime = function () {
    return this.__executedCpuTime;
};

Task.prototype.getEstimatedDuration = function () {
    return this.estimatedDuration;
};

/**
 *
 * @param {Task} task
 * @returns Task
 */
Task.prototype.addDependency = function (task) {
    assert.notEqual(task, undefined, 'task is undefined');
    assert.notEqual(task, null, 'task is null');

    this.dependencies.push(task);
    return this;
};

/**
 *
 * @param {Task[]} tasks
 */
Task.prototype.addDependencies = function (tasks) {
    tasks.forEach(t => this.addDependency(t));
};

Task.prototype.toString = function () {
    return `Task{name:'${this.name}'}`;
};

/**
 *
 * @param {function} resolve
 * @param {function} reject
 */
Task.prototype.join = function (resolve, reject) {
    Task.join(this, resolve, reject);
};

/**
 * Run entire task synchronously to completion
 */
Task.prototype.executeSync = function () {
    this.initialize();

    let s = this.cycle();

    for (; s !== TaskSignal.EndSuccess && s !== TaskSignal.EndFailure; s = this.cycle()) {
        //keep running
    }

    return s;
};

/**
 *
 * @param {Task} task
 */
Task.promise = function (task) {
    return new Promise((resolve, reject) => Task.join(task, resolve, reject));
};

/**
 *
 * @param {Task} task
 * @param {function} resolve
 * @param {function} reject
 */
Task.join = function (task, resolve, reject) {
    const state = task.state.getValue();
    if (state === TaskState.SUCCEEDED) {
        resolve();
    } else if (state === TaskState.FAILED) {
        if (reject !== undefined) {
            reject();
        }
    } else {
        task.on.completed.addOne(resolve);
        if (reject !== undefined) {
            task.on.failed.addOne(reject);
        }
    }
};


/**
 *
 * @param {Task[]} tasks
 * @param {function} resolve
 * @param {function} reject
 */
Task.joinAll = function (tasks, resolve, reject) {
    let liveCount = tasks.length;

    if (liveCount === 0) {
        //empty input
        resolve();
        return;
    }

    let failedDispatched = false;

    function cbOK() {
        liveCount--;
        if (liveCount <= 0 && !failedDispatched) {
            resolve();
        }
    }

    function cbFailed() {
        if (!failedDispatched) {
            failedDispatched = true;
            reject(arguments);
        }
    }

    for (let i = 0; i < tasks.length; i++) {
        tasks[i].join(cbOK, cbFailed);
    }
};

export default Task;
