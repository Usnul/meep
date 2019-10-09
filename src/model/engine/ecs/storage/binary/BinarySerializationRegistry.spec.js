import { BinarySerializationRegistry } from "./BinarySerializationRegistry.js";
import { BinaryClassSerializationAdapter } from "./BinaryClassSerializationAdapter.js";
import { BinaryClassUpgrader } from "./BinaryClassUpgrader.js";

function sampleAdapter() {
    return new BinaryClassSerializationAdapter();
}

/**
 *
 * @param {number} v0
 * @param {number} v1
 * @returns {BinaryClassUpgrader}
 */
function makeUpgrader(v0, v1) {
    const upgrader = new BinaryClassUpgrader();

    upgrader.__startVersion = v0;
    upgrader.__targetVersion = v1;

    return upgrader;
}

test("constructor doesn't throw", () => {
    new BinarySerializationRegistry();
});

test("registerAdapter", () => {
    const registry = new BinarySerializationRegistry();

    expect(registry.registerAdapter(sampleAdapter(), "a")).toBe(true);

    //a class with than name is already registered
    expect(registry.registerAdapter(sampleAdapter(), "a")).toBe(false);
});

test("getAdapter", () => {
    const registry = new BinarySerializationRegistry();


    expect(registry.getAdapter("a")).not.toBeDefined();

    const adapter = sampleAdapter();
    registry.registerAdapter(adapter, "a");

    expect(registry.getAdapter("a")).toBe(adapter);
});

test("find a chain of 3 upgraders", () => {
    const a = makeUpgrader(0, 1);
    const b = makeUpgrader(1, 1.6);
    const c = makeUpgrader(1.6, 49);

    const registry = new BinarySerializationRegistry();

    expect(registry.registerUpgrader("x", a)).toBe(true);
    expect(registry.registerUpgrader("x", b)).toBe(true);
    expect(registry.registerUpgrader("x", c)).toBe(true);

    const chain = registry.getUpgradersChain("x", 0, 49);

    expect(chain).toBeDefined();
    expect(chain.length).toBe(3);

    expect(chain[0]).toBe(a);
    expect(chain[1]).toBe(b);
    expect(chain[2]).toBe(c);
});

test("find a chain of upgraders with 2 starts", () => {

    const a0 = makeUpgrader(0, 1);
    const a1 = makeUpgrader(0, 1);
    const b = makeUpgrader(1, 13);

    const registry = new BinarySerializationRegistry();

    expect(registry.registerUpgrader("x", a0)).toBe(true);
    expect(registry.registerUpgrader("x", a1)).toBe(true);
    expect(registry.registerUpgrader("x", b)).toBe(true);

    const chain = registry.getUpgradersChain("x", 0, 13);

    expect(chain).toBeDefined();
    expect(chain.length).toBe(2);
});

test("find a chain of upgraders with no upgraders", () => {


    const registry = new BinarySerializationRegistry();

    expect(() => registry.getUpgradersChain("x", 0, 13)).toThrow();
});

test("find a chain of upgraders with a single upgrader", () => {
    const a = makeUpgrader(0, 1);

    const registry = new BinarySerializationRegistry();

    expect(registry.registerUpgrader("x", a)).toBe(true);

    const chain = registry.getUpgradersChain("x", 0, 1);

    expect(chain).toBeDefined();
    expect(chain.length).toBe(1);

    expect(chain[0]).toBe(a);
});

test("find a chain of upgraders with 0 version range", () => {
    const registry = new BinarySerializationRegistry();

    const chain = registry.getUpgradersChain("x", 0, 0);

    expect(chain).toBeDefined();
    expect(chain.length).toBe(0);
});

test("find the shortest chain among two", () => {
    const a0 = makeUpgrader(0, 1);
    const a1 = makeUpgrader(1, 2);
    const a2 = makeUpgrader(2, 3);

    const b1 = makeUpgrader(1, 3);

    const registry = new BinarySerializationRegistry();

    registry.registerUpgrader("x", a0);
    registry.registerUpgrader("x", a1);
    registry.registerUpgrader("x", a2);

    registry.registerUpgrader("x", b1);

    const chain = registry.getUpgradersChain("x", 0, 3);

    expect(chain).toBeDefined();
    expect(chain.length).toBe(2);
});
