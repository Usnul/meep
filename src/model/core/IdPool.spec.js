import IdPool from "./IdPool.js";

test('traverseUsed works correctly', () => {
    const pool = new IdPool();

    const visitorA = jest.fn();

    pool.traverseUsed(visitorA);

    expect(visitorA).not.toHaveBeenCalled();

    pool.getSpecific(99);

    pool.traverseUsed(visitorA);

    expect(visitorA).toHaveBeenCalledTimes(1);
    expect(visitorA).toHaveBeenLastCalledWith(99);

    pool.getSpecific(17);

    const visitorB = jest.fn();

    pool.traverseUsed(visitorB);

    expect(visitorB).toHaveBeenCalledTimes(2);
    expect(visitorB).toHaveBeenCalledWith(17);
    expect(visitorB).toHaveBeenCalledWith(99);
});