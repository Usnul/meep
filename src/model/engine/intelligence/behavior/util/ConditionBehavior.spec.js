import { ConditionBehavior } from "./ConditionBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

test('initialize', () => {
    const b = new ConditionBehavior(() => true);

    b.initialize();

    expect(b.getStatus()).toBe(BehaviorStatus.Running);
});

test('positive', () => {
    const b = new ConditionBehavior(() => true);

    b.initialize();

    expect(b.tick(0)).toBe(BehaviorStatus.Succeeded);

    expect(b.getStatus()).toBe(BehaviorStatus.Succeeded);
});

test('negative', () => {
    const b = new ConditionBehavior(() => false);

    b.initialize();

    expect(b.tick(0)).toBe(BehaviorStatus.Failed);

    expect(b.getStatus()).toBe(BehaviorStatus.Failed);
});