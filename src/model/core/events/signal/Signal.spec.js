import Signal from "./Signal.js";

test("Handler is removed after single execution when added via addOne", () => {

    const handler = jest.fn();
    const signal = new Signal();

    signal.addOne(handler);

    signal.dispatch();

    expect(handler).toHaveBeenCalledTimes(1);

    signal.dispatch();

    expect(handler).toHaveBeenCalledTimes(1);
});

test('Remove handler added via addOne', () => {

    const handler = jest.fn();
    const signal = new Signal();

    signal.addOne(handler);

    expect(signal.hasHandlers()).toBe(true);

    signal.remove(handler);

    expect(signal.hasHandlers()).toBe(false);

});

test('Handler added during dispatch is not called', () => {
    const handler = jest.fn();
    const signal = new Signal();

    signal.add(function () {
        signal.add(handler);
    });

    signal.dispatch();

    expect(handler).not.toHaveBeenCalled();
});

test('Handler added during dispatch is properly registered', () => {
    const handler = jest.fn();
    const signal = new Signal();

    function handlerA() {
        signal.add(handler);
    }

    signal.add(handlerA);

    signal.dispatch();

    expect(handler).not.toHaveBeenCalled();

    signal.dispatch();

    expect(handler).toHaveBeenCalledTimes(1);
});

test('multiple handlers invoked during dispatch', () => {
    const first = jest.fn();
    const second = jest.fn();

    const signal = new Signal();

    signal.add(first);
    signal.add(second);

    signal.dispatch();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
});

test('removed handler is no longer invoked', () => {
    const handler = jest.fn();
    const signal = new Signal();

    signal.add(handler);

    signal.dispatch();

    signal.remove(handler);

    signal.dispatch();

    expect(handler).toHaveBeenCalledTimes(1);
});

test('dispatch arguments are passed to handler', () => {
    const handler = jest.fn();
    const signal = new Signal();

    signal.add(handler);

    signal.dispatch(1, "a");

    expect(handler).toHaveBeenLastCalledWith(1, "a");
});

test('mute() and unmute() should work correctly', () => {

    const handler = jest.fn();
    const handlerOnce = jest.fn();

    const signal = new Signal();

    signal.add(handler);

    signal.mute();

    signal.dispatch();

    expect(handler).not.toHaveBeenCalled();

    signal.addOne(handlerOnce);

    signal.dispatch();

    expect(handlerOnce).not.toHaveBeenCalled();

    signal.unmute();

    signal.dispatch();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handlerOnce).toHaveBeenCalledTimes(1);
});

test("handler context is properly setup during dispatch", () => {
    const signal = new Signal();

    const handler = jest.fn(function () {
        expect(this).toBe(42);
    });

    signal.add(handler, 42);

    signal.dispatch();

    expect(handler).toHaveBeenCalled();
});
