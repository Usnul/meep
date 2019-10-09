import GridObstacle from "./GridObstacle.js";

test('resize 1x1 to 1x2', () => {
    const g = new GridObstacle();

    g.size.set(1, 1);
    g.data = [7];

    g.resize(1, 2);

    expect(g.data[0]).toBe(7);
});

test('resize 1x1 to 2x1', () => {
    const g = new GridObstacle();

    g.size.set(1, 1);
    g.data = [7];

    g.resize(2, 1);

    expect(g.data[0]).toBe(7);
});


test('resize 2x1 to 1x1', () => {
    const g = new GridObstacle();

    g.size.set(2, 1);
    g.data = [3, 7];

    g.resize(1, 1);

    expect(g.data[0]).toBe(3);
});

test('resize 1x2 to 1x1', () => {
    const g = new GridObstacle();

    g.size.set(1, 2);
    g.data = [3, 7];

    g.resize(1, 1);

    expect(g.data[0]).toBe(3);
});