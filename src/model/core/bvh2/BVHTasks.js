import Task from "../process/task/Task.js";
import { optimize } from "./transform/RotationOptimizer.js";
import TaskSignal from "../process/task/TaskSignal.js";
import { RingBuffer } from "../collection/RingBuffer.js";


/**
 *
 * @param {BinaryNode} bvh
 * @param {number} iterationLength
 * @returns {Task}
 */
export function buildTreeOptimizationTask(bvh, iterationLength) {

    const buffer = new RingBuffer(10);

    let cycles = 0;
    let sameChangeCountCycles = 0;
    //optimize bvh
    const task = new Task({
        name: "Optimization of Bounding Volume Hierarchy",
        cycleFunction() {
            const optimizationsDone = optimize(bvh, iterationLength);
            if (optimizationsDone > 0) {
                console.log('otimization step.. changes: ', optimizationsDone);

                cycles += optimizationsDone;
                if (buffer.contains(optimizationsDone)) {
                    sameChangeCountCycles++;
                    if (sameChangeCountCycles > 100) {
                        console.warn("detected optimization oscillation after 100 cycles, terminating");
                        //stuck in oscillation, probably
                        return TaskSignal.EndSuccess;
                    }
                } else {
                    //reset counter
                    sameChangeCountCycles = 0;
                }

                buffer.push(optimizationsDone);

                return TaskSignal.Continue;
            } else {
                return TaskSignal.EndSuccess;
            }
        },
        computeProgress: function () {
            return cycles / iterationLength;
        }
    });

    return task;
}
