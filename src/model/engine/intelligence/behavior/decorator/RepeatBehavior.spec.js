import { RepeatBehavior } from "./RepeatBehavior.js";
import { SucceedingBehavior } from "../primitive/SucceedingBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";

test("initialization", () => {
    const b = new RepeatBehavior(new SucceedingBehavior(), 1);

    expect(b.getStatus()).toBe(BehaviorStatus.Initial);

    b.initialize();

    expect(b.getStatus()).toBe(BehaviorStatus.Running);
});

test('2 successful repetitions', () => {

    const source = new SucceedingBehavior();

    const tickSpy = jest.spyOn(source, 'tick');

    const b = new RepeatBehavior(source, 2);

    b.initialize();

    expect(b.getStatus()).toBe(BehaviorStatus.Running);

    expect(b.tick(3)).toBe(BehaviorStatus.Running);

    expect(b.getStatus()).toBe(BehaviorStatus.Running);

    expect(tickSpy).toHaveBeenCalledTimes(1);
    expect(tickSpy).toHaveBeenCalledWith(3);

    const tickResult2 = b.tick(7);
    expect(tickResult2).toBe(BehaviorStatus.Succeeded);

    expect(tickSpy).toHaveBeenCalledTimes(2);
    expect(tickSpy).toHaveBeenLastCalledWith(7);

    expect(b.getStatus()).toBe(BehaviorStatus.Succeeded);
});