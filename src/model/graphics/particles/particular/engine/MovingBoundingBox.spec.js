import { MovingBoundingBox } from "./MovingBoundingBox.js";

test("constructor doesn't throw", () => {
    new MovingBoundingBox();
});

test("box expands when moving", () => {
    const box = new MovingBoundingBox();

    box.position.set(0, 0, 0);
    box.objectBounds.setBounds(1, 2, 3, 4, 5, 6);

    box.move(7, 8, 9);

    const tb = box.trailBounds;

    expect(tb.x0).toBe(1);
    expect(tb.y0).toBe(2);
    expect(tb.z0).toBe(3);

    expect(tb.x1).toBe(11);
    expect(tb.y1).toBe(13);
    expect(tb.z1).toBe(15);
});

test("box doesn't shrink while updates are still in memory", () => {
    const box = new MovingBoundingBox();

    box.memory = 1;

    box.position.set(0, 0, 0);
    box.objectBounds.setBounds(1, 2, 3, 4, 5, 6);

    box.move(7, 8, 9);

    box.update(0.5);

    const tb = box.trailBounds;

    expect(tb.x0).toBe(1);
    expect(tb.y0).toBe(2);
    expect(tb.z0).toBe(3);

    expect(tb.x1).toBe(11);
    expect(tb.y1).toBe(13);
    expect(tb.z1).toBe(15);
});

test("box shrinks back to original size after more time than memory passes", () => {
    const box = new MovingBoundingBox();

    box.memory = 1;

    box.position.set(0, 0, 0);
    box.objectBounds.setBounds(1, 2, 3, 4, 5, 6);

    box.move(7, 8, 9);

    box.update(2);

    const tb = box.trailBounds;

    expect(tb.x0).toBe(8);
    expect(tb.y0).toBe(10);
    expect(tb.z0).toBe(12);

    expect(tb.x1).toBe(11);
    expect(tb.y1).toBe(13);
    expect(tb.z1).toBe(15);
});