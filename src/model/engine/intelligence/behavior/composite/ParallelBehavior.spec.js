import { ParallelBehavior, ParallelBehaviorPolicy } from "./ParallelBehavior";
import { SucceedingBehavior } from "../primitive/SucceedingBehavior";
import { BehaviorStatus } from "../BehaviorStatus";
import { FailingBehavior } from "../primitive/FailingBehavior";

test("constructor doesn't throw", () => {
    new ParallelBehavior(ParallelBehaviorPolicy.RequireAll, ParallelBehaviorPolicy.RequireAll);
});

test("1 succeeding child", () => {
    const p = new ParallelBehavior(ParallelBehaviorPolicy.RequireAll, ParallelBehaviorPolicy.RequireOne);

    const b = new SucceedingBehavior();

    b.tick = jest.fn(b.tick);
    b.initialize = jest.fn(b.initialize);
    b.finalize = jest.fn(b.finalize);

    p.addChild(b);

    p.initialize();

    expect(p.tick()).toBe(BehaviorStatus.Succeeded);

    p.finalize();

    expect(b.tick).toHaveBeenCalledTimes(1);
    expect(b.initialize).toHaveBeenCalledTimes(1);
    expect(b.finalize).toHaveBeenCalledTimes(1);
});

test("1 succeeding child, 1 tick delay", () => {
    const p = new ParallelBehavior(ParallelBehaviorPolicy.RequireAll, ParallelBehaviorPolicy.RequireOne);

    const b = new SucceedingBehavior(1);

    b.tick = jest.fn(b.tick);
    b.initialize = jest.fn(b.initialize);
    b.finalize = jest.fn(b.finalize);

    p.addChild(b);

    p.initialize();

    expect(p.tick()).toBe(BehaviorStatus.Running);
    expect(p.tick()).toBe(BehaviorStatus.Succeeded);

    p.finalize();

    expect(b.tick).toHaveBeenCalledTimes(2);
    expect(b.initialize).toHaveBeenCalledTimes(1);
    expect(b.finalize).toHaveBeenCalledTimes(1);
});

test("1 failing child", () => {
    const p = new ParallelBehavior(ParallelBehaviorPolicy.RequireAll, ParallelBehaviorPolicy.RequireOne);

    const b = new FailingBehavior();

    b.tick = jest.fn(b.tick);
    b.initialize = jest.fn(b.initialize);
    b.finalize = jest.fn(b.finalize);

    p.addChild(b);

    p.initialize();

    expect(p.tick()).toBe(BehaviorStatus.Failed);

    p.finalize();

    expect(b.tick).toHaveBeenCalledTimes(1);
    expect(b.initialize).toHaveBeenCalledTimes(1);
    expect(b.finalize).toHaveBeenCalledTimes(1);
});

test("1 failing child, 1 tick delay", () => {
    const p = new ParallelBehavior(ParallelBehaviorPolicy.RequireAll, ParallelBehaviorPolicy.RequireOne);

    const b = new FailingBehavior(1);

    b.tick = jest.fn(b.tick);
    b.initialize = jest.fn(b.initialize);
    b.finalize = jest.fn(b.finalize);

    p.addChild(b);

    p.initialize();

    expect(p.tick()).toBe(BehaviorStatus.Running);
    expect(p.tick()).toBe(BehaviorStatus.Failed);

    p.finalize();

    expect(b.tick).toHaveBeenCalledTimes(2);
    expect(b.initialize).toHaveBeenCalledTimes(1);
    expect(b.finalize).toHaveBeenCalledTimes(1);
});

test("policy success-One, failure-One. Succeeding", () => {
    const p = new ParallelBehavior(ParallelBehaviorPolicy.RequireOne, ParallelBehaviorPolicy.RequireOne);

    const a = new SucceedingBehavior(0);

    p.addChild(a);

    const b = new SucceedingBehavior(1);

    p.addChild(b);

    p.initialize();

    expect(p.tick()).toBe(BehaviorStatus.Succeeded);
});

test("policy success-All, failure-One. Succeeding", () => {
    const p = new ParallelBehavior(ParallelBehaviorPolicy.RequireAll, ParallelBehaviorPolicy.RequireOne);

    const a = new SucceedingBehavior(0);

    p.addChild(a);

    const b = new SucceedingBehavior(1);

    p.addChild(b);

    p.initialize();

    expect(p.tick()).toBe(BehaviorStatus.Running);
    expect(p.tick()).toBe(BehaviorStatus.Succeeded);
});

test("policy success-One, failure-One. Failing", () => {
    const p = new ParallelBehavior(ParallelBehaviorPolicy.RequireOne, ParallelBehaviorPolicy.RequireOne);

    const a = new FailingBehavior(0);

    p.addChild(a);

    const b = new SucceedingBehavior(1);

    p.addChild(b);

    p.initialize();

    expect(p.tick()).toBe(BehaviorStatus.Failed);
});

test("policy success-One, failure-All. Failing", () => {
    const p = new ParallelBehavior(ParallelBehaviorPolicy.RequireOne, ParallelBehaviorPolicy.RequireAll);

    const a = new FailingBehavior(0);

    p.addChild(a);

    const b = new FailingBehavior(1);

    p.addChild(b);

    p.initialize();

    expect(p.tick()).toBe(BehaviorStatus.Running);
    expect(p.tick()).toBe(BehaviorStatus.Failed);
});