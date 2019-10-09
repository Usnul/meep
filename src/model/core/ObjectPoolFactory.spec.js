import { ObjectPoolFactory } from "./ObjectPoolFactory.js";

function create() {
    return {};
}

function destroy() {

}

function reset() {

}

test("Reuses objects", () => {
    const sut = new ObjectPoolFactory(create, destroy, reset);

    const a = sut.create();

    sut.release(a);

    const b = sut.create();

    //must be the same object
    expect(a).toBe(b);
});

test("maxSize is respected", () => {

    const sut = new ObjectPoolFactory(create, destroy, reset);

    sut.maxSize = 2;

    const a = sut.create();
    const b = sut.create();
    const c = sut.create();

    sut.release(a);
    sut.release(b);
    //this one is beyond pool capacity
    sut.release(c);

    const x = sut.create();
    const y = sut.create();
    const z = sut.create();

    expect(x === a || x === b).toBeTruthy();
    expect(x).not.toBe(c);

    expect(y === a || y === b).toBeTruthy();
    expect(y).not.toBe(c);

    expect(z).not.toBe(c);
});