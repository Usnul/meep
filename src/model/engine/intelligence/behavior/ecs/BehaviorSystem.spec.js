import { BehaviorSystem } from "./BehaviorSystem.js";
import { BehaviorComponent } from "./BehaviorComponent.js";
import { Behavior } from "../Behavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { EntityComponentDataset } from "../../../ecs/EntityComponentDataset.js";
import { EntityManager } from "../../../ecs/EntityManager.js";
import { noop } from "../../../../core/function/Functions.js";

test("constructor doesn't throw", () => {
    new BehaviorSystem();
});

test("linking initialized behavior", () => {
    const s = new BehaviorSystem();

    const behavior = new Behavior();
    behavior.initialize = jest.fn();

    s.link(BehaviorComponent.fromOne(behavior), 0);

    expect(behavior.initialize).toHaveBeenCalled();
});

test("unlinking finalizes behavior if it is running", () => {
    const s = new BehaviorSystem();

    const behavior = new Behavior();
    behavior.finalize = jest.fn();
    behavior.setStatus(BehaviorStatus.Running);

    s.unlink(BehaviorComponent.fromOne(behavior), 0);

    expect(behavior.finalize).toHaveBeenCalled();
});

test("update ticks behavior with the time delta", () => {
    const s = new BehaviorSystem();

    const behavior = new Behavior();
    behavior.tick = jest.fn();
    behavior.setStatus(BehaviorStatus.Running);

    const behaviorComponent = BehaviorComponent.fromOne(behavior);

    const ecd = new EntityComponentDataset();
    ecd.setComponentTypeMap([BehaviorComponent]);
    const i = ecd.createEntity();
    ecd.addComponentToEntity(i, behaviorComponent);

    const em = new EntityManager();
    em.dataset = ecd;

    s.startup(em, noop, noop);
    
    s.update(42);

    expect(behavior.tick).toHaveBeenCalledTimes(1);
    expect(behavior.tick).toHaveBeenCalledWith(42);
});

