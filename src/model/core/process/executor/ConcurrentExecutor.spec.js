import ConcurrentExecutor from "./ConcurrentExecutor.js";
import { emptyTask, failingTask } from "../task/TaskUtils";
import Task from '../task/Task'
import TaskState from "../task/TaskState";
import TaskGroup from "../task/TaskGroup.js";
import TaskSignal from "../task/TaskSignal.js";

/**
 *
 * @return {ConcurrentExecutor}
 */
function makeExecutor() {
    return new ConcurrentExecutor(1, 1);
}

test("Constructor doesn't throw", () => {
    expect(() => new ConcurrentExecutor(0, 1)).not.toThrow();
});

test("Execute simple task", async () => {
    const task = emptyTask();

    const cycle = jest.spyOn(task, 'cycle');
    const initialize = jest.spyOn(task, 'initialize');

    const executor = makeExecutor();

    executor.run(task);

    await Task.promise(task);

    expect(cycle).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenCalledTimes(1);

    expect(task.state.getValue()).toBe(TaskState.SUCCEEDED);
});

test("Execute chain of dependent tasks submitted in reverse order", async () => {
    const taskA = emptyTask();
    const taskB = emptyTask();
    const taskC = emptyTask();

    taskC.addDependency(taskB);
    taskB.addDependency(taskA);


    const cycleA = jest.spyOn(taskA, 'cycle');
    const cycleB = jest.spyOn(taskB, 'cycle');
    const cycleC = jest.spyOn(taskC, 'cycle');


    const executor = makeExecutor();

    executor.run(taskC);
    executor.run(taskB);
    executor.run(taskA);

    await Task.promise(taskC);

    expect(cycleA).toHaveBeenCalledTimes(1);
    expect(cycleB).toHaveBeenCalledTimes(1);
    expect(cycleC).toHaveBeenCalledTimes(1);

    expect(taskA.state.getValue()).toBe(TaskState.SUCCEEDED);
    expect(taskB.state.getValue()).toBe(TaskState.SUCCEEDED);
    expect(taskC.state.getValue()).toBe(TaskState.SUCCEEDED);
});


test("TaskGroup state is set to SUCCEEDED after all children succeed", async () => {
    const group = new TaskGroup([emptyTask(), emptyTask()], "a");

    const executor = makeExecutor();

    executor.runGroup(group);

    await Task.promise(group);

    expect(group.state.getValue()).toBe(TaskState.SUCCEEDED);
});

test("TaskGroup state is set to FAILED after one child fails", async () => {
    const group = new TaskGroup([emptyTask(), failingTask("Fail")], "a");

    const executor = makeExecutor();

    executor.runGroup(group);

    await new Promise((resolve, reject) => Task.join(group, resolve, resolve));

    expect(group.state.getValue()).toBe(TaskState.FAILED);
});

test("Remove task during its execution", async () => {
    const executor = makeExecutor();

    let i = 0;
    const task = new Task({
        name: 'test',
        cycleFunction() {

            if (i === 0) {
                const removed = executor.removeTask(task);
                expect(removed).toBe(true);
            }

            i++;

            return TaskSignal.Continue;
        }
    });

    const checkerTask = new Task({
        name: 'Checker',
        cycleFunction() {

            if (executor.contains(task)) {
                return TaskSignal.Yield;
            }

            return TaskSignal.EndSuccess;
        }
    });


    executor.run(task);
    executor.run(checkerTask);

    await Task.promise(checkerTask);

    expect(task.state.getValue()).toBe(TaskState.RUNNING);
    expect(executor.contains(task)).toBe(false);
});
