import { PromiseWatcher } from "./PromiseWatcher.js";
import { noop } from "../function/Functions.js";

function trigger() {
    let _resolve;
    let _reject;

    const promise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
    });

    //Node.js doesn't allow unhandled rejections, lets handle it with noop
    promise.catch(noop);

    return {
        promise,
        reject(r) {
            _reject(r)
        },
        resolve(v) {
            _resolve(v);
        }
    };
}

test('constructor', () => {
    const w = new PromiseWatcher();

    expect(w.unresolvedCount.getValue()).toBe(0);
    expect(w.unresolved.isEmpty()).toBe(true);
});


test('add one and resolve', async () => {
    const w = new PromiseWatcher();

    const t0 = trigger();

    w.add(t0.promise);

    expect(w.unresolvedCount.getValue()).toBe(1);

    t0.resolve();

    await t0.promise;

    expect(w.unresolvedCount.getValue()).toBe(0);
});

test('add one and reject', async () => {
    const w = new PromiseWatcher();

    const t0 = trigger();

    w.add(t0.promise);

    expect(w.unresolvedCount.getValue()).toBe(1);

    t0.reject("Apple Sauce");

    await t0.promise.catch(noop);

    expect(w.unresolvedCount.getValue()).toBe(0);
});
