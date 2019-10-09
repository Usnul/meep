import { QuadTreeNode } from "./QuadTreeNode.js";
import { QuadTreeDatum } from "./QuadTreeDatum.js";

test('constructor', () => {
    const tree = new QuadTreeNode(1, 2, 3, 5);

    expect(tree.x0).toEqual(1);
    expect(tree.y0).toEqual(2);
    expect(tree.x1).toEqual(3);
    expect(tree.y1).toEqual(5);
});

test('inset node', () => {
    const tree = new QuadTreeNode();

    const datum = new QuadTreeDatum();

    tree.insertDatum(datum);

    expect(datum.parentNode).not.toBeNull();
});

test('add method creates valid Datum', () => {
    const tree = new QuadTreeNode();

    const datum = tree.add("a", 1, 2, 3, 4);

    expect(datum).toBeDefined();

    expect(datum.data).toEqual("a");

    expect(datum.x0).toEqual(1);
    expect(datum.y0).toEqual(2);
    expect(datum.x1).toEqual(3);
    expect(datum.y1).toEqual(4);

    expect(datum.parentNode).toEqual(tree);
});

test('disconnect node', () => {
    const tree = new QuadTreeNode();

    const datum = new QuadTreeDatum();

    tree.insertDatum(datum);

    datum.disconnect();

    expect(datum.parentNode).toBeNull();

    expect(tree.treeDataCount).toBe(0);
});

test('tree resized to accommodate new node', () => {
    const tree = new QuadTreeNode();

    const datum = new QuadTreeDatum(-1, -3, 5, 7);

    tree.insertDatum(datum);

    datum.disconnect();

    expect(datum.parentNode).toBeNull();

    expect(tree.treeDataCount).toBe(0);

    expect(tree.x0).toBe(datum.x0);
    expect(tree.y0).toBe(datum.y0);
    expect(tree.x1).toBe(datum.x1);
    expect(tree.y1).toBe(datum.y1);
});

test('tree resized to accommodate node being moved', () => {
    const tree = new QuadTreeNode();

    const datum = new QuadTreeDatum(-1, -3, 5, 7);

    tree.insertDatum(datum);

    datum.move(1, 2);

    expect(tree.x0).toBe(-1);
    expect(tree.y0).toBe(-3);
    expect(tree.x1).toBe(6);
    expect(tree.y1).toBe(9);
});

test('insert 100 nodes', () => {
    const tree = new QuadTreeNode();

    const elements = [];

    for (let i = 0; i < 100; i++) {
        const datum = new QuadTreeDatum(i, i, i + 1, i + 1);

        tree.insertDatum(datum);

        elements.push(datum);
    }

    for (let i = 0; i < elements.length; i++) {
        const datum = elements[i];

        expect(datum.parentNode).not.toBeNull();
    }

    expect(tree.treeDataCount).toBe(100);
});

test('insert and remove 100 nodes', () => {
    const tree = new QuadTreeNode();

    const elements = [];

    for (let i = 0; i < 100; i++) {
        const datum = new QuadTreeDatum(i, i, i + 1, i + 1);

        tree.insertDatum(datum);

        elements.push(datum);
    }

    //remove elements
    for (let i = 0; i < elements.length; i++) {
        const datum = elements[i];

        datum.disconnect();
    }

    expect(tree.treeDataCount).toBe(0);
});

test('test traverseRectangleIntersections', () => {
    const tree = new QuadTreeNode();

    const a = tree.add("a", 0, 0, 1, 1);
    const b = tree.add("b", 2, 0, 3, 1);

    const c = tree.add("c", 1, 1, 2, 2);

    const d = tree.add("d", 0, 2, 1, 3);
    const e = tree.add("e", 2, 2, 3, 3);

    const visitor = jest.fn();

    tree.traverseRectangleIntersections(0, 0, 1, 1, visitor);

    expect(visitor).toHaveBeenCalledTimes(1);
    expect(visitor).toHaveBeenLastCalledWith(a);

    tree.traverseRectangleIntersections(2, 0, 3, 1, visitor);

    expect(visitor).toHaveBeenCalledTimes(2);
    expect(visitor).toHaveBeenLastCalledWith(b);

    tree.traverseRectangleIntersections(1, 1, 2, 2, visitor);

    expect(visitor).toHaveBeenCalledTimes(3);
    expect(visitor).toHaveBeenLastCalledWith(c);

    tree.traverseRectangleIntersections(0, 2, 1, 3, visitor);

    expect(visitor).toHaveBeenCalledTimes(4);
    expect(visitor).toHaveBeenLastCalledWith(d);

    tree.traverseRectangleIntersections(2, 2, 3, 3, visitor);

    expect(visitor).toHaveBeenCalledTimes(5);
    expect(visitor).toHaveBeenLastCalledWith(e);

    const visitor0 = jest.fn();

    tree.traverseRectangleIntersections(0, 0, 3, 3, visitor0);

    expect(visitor0).toHaveBeenCalledTimes(5);
    expect(visitor0).toHaveBeenCalledWith(a);
    expect(visitor0).toHaveBeenCalledWith(b);
    expect(visitor0).toHaveBeenCalledWith(c);
    expect(visitor0).toHaveBeenCalledWith(d);
    expect(visitor0).toHaveBeenCalledWith(e);
});
