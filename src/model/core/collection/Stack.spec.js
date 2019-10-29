import { Stack } from "./Stack.js";

test('pop from empty returns undefined', () => {
    const stack = new Stack();

    expect(stack.pop()).toBe(undefined);
});

test("isEmpty works correctly", () => {
    const stack = new Stack();

    expect(stack.isEmpty()).toBe(true);

    stack.push(1);

    expect(stack.isEmpty()).toBe(false);

    stack.pop();

    expect(stack.isEmpty()).toBe(true);
});

test('push followed by pop returns the same elements in reverse order', () => {
    const stack = new Stack();

    stack.push(42);
    stack.push(3);
    stack.push(7);

    expect(stack.pop()).toBe(7);
    expect(stack.pop()).toBe(3);
    expect(stack.pop()).toBe(42);
});


test("peek returns top element", () => {
    const stack = new Stack();

    expect(stack.peek()).toBe(undefined);

    stack.push(42);

    expect(stack.peek()).toBe(42);

    stack.push(3);

    expect(stack.peek()).toBe(3);
});
