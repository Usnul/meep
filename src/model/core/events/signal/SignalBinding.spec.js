import { SignalBinding } from "./SignalBinding.js";
import Signal from "./Signal.js";

test('initially binding is not linked', () => {
    const signal = new Signal();
    const handler = jest.fn();

    new SignalBinding(signal, handler);

    signal.dispatch();

    expect(handler).not.toHaveBeenCalled();
});

test('linking attached handler to the signal', () => {
    const signal = new Signal();
    const handler = jest.fn();

    const binding = new SignalBinding(signal, handler);

    binding.link();

    expect(signal.contains(handler)).toBe(true);
});

test('unlinking removed handler from the signal', () => {
    const signal = new Signal();
    const handler = jest.fn();

    const binding = new SignalBinding(signal, handler);

    binding.link();
    binding.unlink();

    expect(signal.contains(handler)).toBe(false);
});


test('link method is idempotent', () => {
    const signal = new Signal();
    const handler = jest.fn();

    const binding = new SignalBinding(signal, handler);

    binding.link();
    binding.link();

    signal.dispatch();

    expect(handler).toHaveBeenCalledTimes(1);

    binding.unlink();

    signal.dispatch();

    expect(signal.contains(handler)).toBe(false);
});
