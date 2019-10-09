import { ParticleAttributeType, ParticleDataType, ParticleGroup, } from "./ParticleGroup";
import { ParticleSpecification } from "./ParticleSpecification.js";
import { ParticleAttribute } from "./ParticleAttribute.js";

test("After calling grow(1) size is increased by 1", () => {
    const spec = new ParticleSpecification();
    const particleGroup = new ParticleGroup(spec);

    const oldSize = particleGroup.size;

    particleGroup.grow(1);

    expect(particleGroup.size).toBe(oldSize + 1);
});

test("After calling reset() size is 0", () => {
    const spec = new ParticleSpecification();
    const particleGroup = new ParticleGroup(spec);

    particleGroup.grow(1);
    particleGroup.reset();

    expect(particleGroup.size).toBe(0);
});

test("deleteIndices() removes end element correctly", () => {

    const spec = new ParticleSpecification();
    spec.add(new ParticleAttribute("a", ParticleAttributeType.Vector2, ParticleDataType.Uint8));

    const particleGroup = new ParticleGroup(spec);

    const p0 = particleGroup.create();
    const p1 = particleGroup.create();

    particleGroup.writeAttribute(p0, 0, [2, 5]);

    particleGroup.update();

    //delete index
    particleGroup.deleteIndices([1]);

    const temp = [];
    particleGroup.readAttribute(p0, 0, temp);

    expect(temp).toEqual([2, 5]);
});

test("deleteIndices() updates size correctly", () => {
    const spec = new ParticleSpecification();
    spec.add(new ParticleAttribute("a", ParticleAttributeType.Vector2, ParticleDataType.Uint8));

    const particleGroup = new ParticleGroup(spec);

    particleGroup.grow(5);
    particleGroup.deleteIndices([0, 2, 4]);

    expect(particleGroup.size).toBe(2);
});

test("deleteIndices() updates remaining indices correctly", () => {
    const spec = new ParticleSpecification();
    spec.add(new ParticleAttribute("a", ParticleAttributeType.Vector2, ParticleDataType.Uint8));

    const particleGroup = new ParticleGroup(spec);

    for (let i = 0; i < 5; i++) {
        particleGroup.create();
    }
    particleGroup.update();

    particleGroup.deleteIndices([0, 2, 4]);

    expect(particleGroup.indexReferenceLookup).toContain(1);
    expect(particleGroup.indexReferenceLookup).toContain(3);
});


test("deleteIndices() cuts correct attribute elements", () => {
    const spec = new ParticleSpecification();
    spec.add(new ParticleAttribute("a", ParticleAttributeType.Vector2, ParticleDataType.Uint8));

    const group = new ParticleGroup(spec);

    const refs = [];
    for (let i = 0; i < 5; i++) {
        const ref = group.create();
        group.writeAttribute(ref, 0, [i, 5 + i]);

        refs.push(ref);
    }

    group.update();

    expect(group.size).toBe(5);

    group.deleteIndices([0, 2, 4]);

    expect(group.size).toBe(2);

    const temp = [];

    group.readAttribute(refs[1], 0, temp);

    expect(temp).toEqual([1, 6]);

    group.readAttribute(refs[3], 0, temp);

    expect(temp).toEqual([3, 8]);
});

test("grow() increases attribute element count correctly", () => {

    const spec = new ParticleSpecification();
    spec.add(new ParticleAttribute("a", ParticleAttributeType.Vector2, ParticleDataType.Uint8));

    const particleGroup = new ParticleGroup(spec);

    particleGroup.grow(3);

    expect(particleGroup.attributes[0].count).toBeGreaterThanOrEqual(3);
    expect(particleGroup.attributes[0].array.length).toBeGreaterThanOrEqual(6);
});

test("multiple operations produce expected result after update", () => {

    const spec = new ParticleSpecification();
    spec.add(new ParticleAttribute("a", ParticleAttributeType.Vector2, ParticleDataType.Uint8));

    const group = new ParticleGroup(spec);

    const p0 = group.create();

    group.writeAttribute(p0, 0, [1, 2]);

    const p1 = group.create();

    group.remove(p0);

    const p2 = group.create();

    group.writeAttribute(p2, 0, [5, 7]);

    group.remove(p1);

    group.update();

    //expect only one particle to be alive
    expect(group.size).toEqual(1);

    group.setCapacity(1);

    const attribute = group.attributes[0];
    expect(attribute.array).toEqual(Uint8Array.from([5, 7]));
    expect(attribute.count).toEqual(1);
});

test("swap method works correctly", () => {
    const spec = new ParticleSpecification();

    spec.add(new ParticleAttribute("a", ParticleAttributeType.Vector2, ParticleDataType.Uint8));

    const group = new ParticleGroup(spec);

    const count = 3;

    const refs = [];

    for (let i = 0; i < count; i++) {
        const ref = group.create();
        group.writeAttribute(ref, 0, [i, count + i]);

        refs.push(ref);
    }

    group.update();

    group.swap(0, 1);

    const result = [];

    //verify swap
    group.readAttributeByIndex(0, 0, result);

    expect(result).toEqual([1, 4]);

    group.readAttributeByIndex(1, 0, result);

    expect(result).toEqual([0, 3]);

    group.readAttributeByIndex(2, 0, result);

    expect(result).toEqual([2, 5]);


    //do swap
    group.swap(2, 1);

    group.readAttributeByIndex(0, 0, result);

    expect(result).toEqual([1, 4]);

    group.readAttributeByIndex(1, 0, result);

    expect(result).toEqual([2, 5]);

    group.readAttributeByIndex(2, 0, result);

    expect(result).toEqual([0, 3]);

    //do swap
    group.swap(2, 0);

    group.readAttributeByIndex(0, 0, result);

    expect(result).toEqual([0, 3]);

    group.readAttributeByIndex(1, 0, result);

    expect(result).toEqual([2, 5]);

    group.readAttributeByIndex(2, 0, result);

    expect(result).toEqual([1, 4]);

    //try swapping element with itself
    group.swap(1, 1);

    group.readAttributeByIndex(0, 0, result);

    expect(result).toEqual([0, 3]);

    group.readAttributeByIndex(1, 0, result);

    expect(result).toEqual([2, 5]);

    group.readAttributeByIndex(2, 0, result);

    expect(result).toEqual([1, 4]);
});

test("attributes are written correctly", () => {
    const spec = new ParticleSpecification();
    spec.add(new ParticleAttribute("a", ParticleAttributeType.Vector2, ParticleDataType.Uint8));

    const group = new ParticleGroup(spec);

    const refs = [];

    const count = 3;

    for (let i = 0; i < count; i++) {
        const ref = group.create();
        group.writeAttribute(ref, 0, [i, count + i]);

        refs.push(ref);
    }

    group.update();

    for (let i = 0; i < count; i++) {
        const ref = refs[i];
        const value = [];
        group.readAttribute(ref, 0, value);
        expect(value).toEqual([i, count + i]);
    }

});