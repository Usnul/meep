import { Cache } from "./Cache";

test("constructor doesn't throw", () => {
    new Cache({});
});

test("elements beyond capacity are evicted", () => {
    const removeListener = jest.fn();

    const cache = new Cache({ maxWeight: 3, removeListener });

    cache.put(1, 1);
    cache.put(2, 2);
    cache.put(4, 4);
    cache.put(5, 5);

    expect(cache.size()).toBe(3);

});

test("removeListener is called when element is evicted", () => {

    const removeListener = jest.fn();

    const cache = new Cache({ maxWeight: 1, removeListener });

    cache.put(1, 7);

    expect(removeListener).not.toHaveBeenCalled();

    cache.put(2, 9);

    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledWith(1, 7);
});

test("new cache is empty", () => {
    const cache = new Cache({});

    expect(cache.size()).toBe(0);
});

test("cache.drop() doesn't invoke removeListener", () => {
    const removeListener = jest.fn();

    const cache = new Cache({ removeListener });

    cache.put(1, 1);

    cache.drop();

    expect(removeListener).not.toHaveBeenCalled();
});

test("cache is emptied by cache.drop()", () => {
    const cache = new Cache({});

    cache.put(1, 2);

    cache.drop();

    expect(cache.size()).toBe(0);
});

test("store and retrieve the same item", () => {

    const cache = new Cache({});

    cache.put("a", "b");

    expect(cache.get("a")).toBe("b");

    cache.put("c", "d");

    expect(cache.get("c")).toBe("d");
});