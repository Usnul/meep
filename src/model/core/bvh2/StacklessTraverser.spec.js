import { BinaryNode } from "./BinaryNode";
import { StacklessTraverser } from "./StacklessTraverser";

test("empty node traversal", () => {
    const node = new BinaryNode();

    const traverser = new StacklessTraverser();

    traverser.init(node);

    const visitor = jest.fn();

    expect(traverser.advance(visitor)).toBe(true);

    expect(visitor).toHaveBeenCalledTimes(1);
    expect(visitor).toHaveBeenCalledWith(node);

    expect(traverser.advance(visitor)).toBe(false);

    expect(visitor).toHaveBeenCalledTimes(1);
});

test("only left child", () => {
    const node = new BinaryNode();
    node.left = new BinaryNode();
    node.left.parentNode = node;

    const traverser = new StacklessTraverser();

    traverser.init(node);

    const visitor = jest.fn();

    expect(traverser.advance(visitor)).toBe(true);

    expect(visitor).toHaveBeenCalledTimes(1);
    expect(visitor).toHaveBeenCalledWith(node);

    expect(traverser.advance(visitor)).toBe(true);

    expect(visitor).toHaveBeenCalledTimes(2);
    expect(visitor).toHaveBeenLastCalledWith(node.left);

    expect(traverser.advance(visitor)).toBe(false);

    expect(visitor).toHaveBeenCalledTimes(2);
});

test("only right child", () => {
    const node = new BinaryNode();
    node.right = new BinaryNode();
    node.right.parentNode = node;

    const traverser = new StacklessTraverser();

    traverser.init(node);

    const visitor = jest.fn();

    expect(traverser.advance(visitor)).toBe(true);

    expect(visitor).toHaveBeenCalledTimes(1);
    expect(visitor).toHaveBeenCalledWith(node);

    expect(traverser.advance(visitor)).toBe(true);

    expect(visitor).toHaveBeenCalledTimes(2);
    expect(visitor).toHaveBeenLastCalledWith(node.right);

    expect(traverser.advance(visitor)).toBe(false);

    expect(visitor).toHaveBeenCalledTimes(2);
});

test("node with left and right child", () => {
    const node = new BinaryNode();

    node.right = new BinaryNode();
    node.right.parentNode = node;

    node.left = new BinaryNode();
    node.left.parentNode = node;

    const traverser = new StacklessTraverser();

    traverser.init(node);

    const visitor = jest.fn();

    expect(traverser.advance(visitor)).toBe(true);

    expect(visitor).toHaveBeenCalledTimes(1);
    expect(visitor).toHaveBeenCalledWith(node);

    expect(traverser.advance(visitor)).toBe(true);

    expect(visitor).toHaveBeenCalledTimes(2);
    expect(visitor).toHaveBeenLastCalledWith(node.left);

    expect(traverser.advance(visitor)).toBe(true);

    expect(visitor).toHaveBeenCalledTimes(3);
    expect(visitor).toHaveBeenLastCalledWith(node.right);

    expect(traverser.advance(visitor)).toBe(false);

    expect(visitor).toHaveBeenCalledTimes(3);
});
