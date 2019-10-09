/**
 * Created by Alex on 19/08/2016.
 */
import Signal from '../../events/signal/Signal.js';
import TaskState from './TaskState';
import Task from './Task';
import ObservedValue from '../../model/ObservedValue';
import { assert } from "../../assert.js";

/**
 *
 * @param {Task[]} subtasks
 * @param {string} name
 * @constructor
 */
function TaskGroup(subtasks, name) {
    this.name = name;

    this.children = subtasks;


    const self = this;

    this.computeProgress = function () {
        const children = self.children;
        const numChildren = children.length;
        let progressSum = 0;
        let progressTotal = 0;
        for (let i = 0; i < numChildren; i++) {
            const child = children[i];
            const estimatedDuration = child.getEstimatedDuration();

            if (isNaN(estimatedDuration)) {
                //Duration is not a number, ignore this child
                continue;
            }

            const childProgress = child.computeProgress();

            assert.ok(childProgress >= 0 && childProgress <= 1, `Expected progress to be between 0 and 1, instead was '${childProgress}'`);

            progressSum += childProgress * estimatedDuration;
            progressTotal += estimatedDuration;
        }

        if (progressTotal === 0) {
            return 0;
        } else {
            return progressSum / progressTotal;
        }

    };

    this.on = {
        started: new Signal(),
        completed: new Signal(),
        failed: new Signal()
    };

    this.state = new ObservedValue(TaskState.INITIAL);
}

TaskGroup.prototype.getEstimatedDuration = function () {
    return this.children.reduce(function (s, child) {
        const childDuration = child.getEstimatedDuration();

        if (isNaN(childDuration) || childDuration < 0) {
            return s;
        } else {
            return s + childDuration;
        }

    }, 0);
};
TaskGroup.prototype.join = function (resolve, reject) {
    Task.join(this, resolve, reject);
};

export default TaskGroup;
