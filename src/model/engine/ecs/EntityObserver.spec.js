import { EntityObserver } from "./EntityObserver";
import Transform from "./components/Transform";
import GridPosition from "../grid/components/GridPosition";
import EntityBuilder from "./EntityBuilder";
import { EntityComponentDataset } from "./EntityComponentDataset.js";
import { noop } from "../../core/function/Functions.js";

/**
 *
 * @return {EntityComponentDataset}
 */
function makeDataset() {

    const dataset = new EntityComponentDataset();

    dataset.setComponentTypeMap([Transform, GridPosition]);

    return dataset;
}

test("valid constructor invocation does not throw", () => {
    new EntityObserver([Transform, GridPosition], noop, noop);
});

test("callbacks are not invoked in the constructor", () => {
    const completed = jest.fn();
    const broken = jest.fn();

    const observer = new EntityObserver([Transform, GridPosition], completed, broken);

    expect(completed).not.toHaveBeenCalled();
    expect(broken).not.toHaveBeenCalled();
});

test("existing entities that match are supplied via callback when attaching", () => {
    const completed = jest.fn();
    const broken = jest.fn();


    const dataset = makeDataset();

    const t0 = new Transform();
    const g0 = new GridPosition();
    const entity0 = new EntityBuilder().add(t0).add(g0).build(dataset);

    const t1 = new Transform();
    const g1 = new GridPosition();
    const entity1 = new EntityBuilder().add(t1).add(g1).build(dataset);

    new EntityBuilder().add(new Transform()).build(dataset);

    const observer = new EntityObserver([Transform, GridPosition], completed, broken);

    observer.connect(dataset);

    expect(broken).not.toHaveBeenCalled();
    expect(completed).toHaveBeenCalledTimes(2);

    expect(completed.mock.calls[0]).toEqual([t0, g0, entity0]);
    expect(completed.mock.calls[1]).toEqual([t1, g1, entity1]);
});

test("completed matches are observed when they happen after attachment", () => {
    const completed = jest.fn();
    const broken = jest.fn();

    const dataset = makeDataset();

    const t0 = new Transform();
    const g0 = new GridPosition();
    const entity0 = new EntityBuilder().add(t0).build(dataset);

    const observer = new EntityObserver([Transform, GridPosition], completed, broken);

    observer.connect(dataset);

    expect(broken).not.toHaveBeenCalled();
    expect(completed).not.toHaveBeenCalled();

    dataset.addComponentToEntity(entity0, g0);

    expect(completed).toHaveBeenCalledTimes(1);

    expect(completed.mock.calls[0]).toEqual([t0, g0, entity0]);
});

test("broken matches are observed", () => {
    const completed = jest.fn();
    const broken = jest.fn();


    const dataset = makeDataset();
    const t0 = new Transform();
    const g0 = new GridPosition();
    const entityBuilder = new EntityBuilder().add(t0).add(g0);
    const entity0 = entityBuilder.build(dataset);

    const observer = new EntityObserver([Transform, GridPosition], completed, broken);

    observer.connect(dataset);

    entityBuilder.removeComponent(GridPosition);

    expect(broken).toHaveBeenCalledTimes(1);

    expect(broken.mock.calls[0]).toEqual([t0, g0, entity0]);
});

test("matching entities added after connect are observed", () => {
    const completed = jest.fn();
    const broken = jest.fn();


    const dataset = makeDataset();
    const t0 = new Transform();
    const g0 = new GridPosition();
    const entityBuilder = new EntityBuilder().add(t0).add(g0);

    const observer = new EntityObserver([Transform, GridPosition], completed, broken);

    const entity0 = entityBuilder.build(dataset);

    observer.connect(dataset);

    expect(completed).toHaveBeenCalledTimes(1);

    expect(completed).toHaveBeenLastCalledWith(t0, g0, entity0);
});

test("match after connect and break", () => {
    const completed = jest.fn();
    const broken = jest.fn();

    const dataset = makeDataset();
    const t0 = new Transform();
    const g0 = new GridPosition();
    const entityBuilder = new EntityBuilder().add(t0).add(g0);

    const observer = new EntityObserver([Transform, GridPosition], completed, broken);

    const entity0 = entityBuilder.build(dataset);

    //observe completed
    observer.connect(dataset);

    expect(completed).toHaveBeenCalledTimes(1);

    expect(completed).toHaveBeenLastCalledWith(t0, g0, entity0);

    //break
    entityBuilder.removeComponent(GridPosition);

    expect(broken).toHaveBeenCalledTimes(1);

    expect(broken).toHaveBeenLastCalledWith(t0, g0, entity0);

    //remove last component
    entityBuilder.removeComponent(Transform);

    //broken shouldn't be called more
    expect(broken).toHaveBeenCalledTimes(1);

    //completed shouldn't be called more
    expect(completed).toHaveBeenCalledTimes(1);

    //remove entity
    entityBuilder.destroy();

    //broken shouldn't be called more
    expect(broken).toHaveBeenCalledTimes(1);

    //completed shouldn't be called more
    expect(completed).toHaveBeenCalledTimes(1);
});

test("disconnect doesn't throw", () => {
    const dataset = makeDataset();
    const observer = new EntityObserver([Transform, GridPosition], noop, noop);

    observer.connect(dataset);

    observer.disconnect();
});