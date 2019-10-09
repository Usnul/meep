import EntityBuilder from "./EntityBuilder.js";
import { EntityComponentDataset } from "./EntityComponentDataset.js";


function DummyComponent() {
}


test("constructor doesn't throw", () => {
    new EntityBuilder();
});

test("entity exists in dataset after build", () => {
    const dataset = new EntityComponentDataset();

    const builder = new EntityBuilder();

    const entity = builder.build(dataset);

    expect(dataset.entityExists(entity)).toBe(true);
});

test("component exist in dataset after build", () => {
    const dataset = new EntityComponentDataset();

    dataset.setComponentTypeMap([DummyComponent]);

    const builder = new EntityBuilder();

    const component = new DummyComponent();

    builder.add(component);

    const entity = builder.build(dataset);

    expect(dataset.entityExists(entity)).toBe(true);

    expect(dataset.getComponentByIndex(entity, 0)).toBe(component);
});