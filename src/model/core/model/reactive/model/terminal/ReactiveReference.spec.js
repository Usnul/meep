import { ReactiveReference } from "./ReactiveReference.js";
import ObservedBoolean from "../../../ObservedBoolean.js";

test('onChange dispatch', () => {
    const ref = new ReactiveReference('x');

    const b = new ObservedBoolean(false);

    ref.connect(b);

    const handler = jest.fn();

    ref.onChanged.add(handler);

    expect(handler).not.toHaveBeenCalled();

    b.set(false);

    expect(handler).not.toHaveBeenCalled();

    b.set(true);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenLastCalledWith(true, false);
});