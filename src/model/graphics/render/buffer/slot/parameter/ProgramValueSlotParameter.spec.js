import { ProgramValueSlotParameter } from "./ProgramValueSlotParameter.js";
import { ProgramValueSlotParameterType } from "./ProgramValueSlotParameterType.js";

test('hash', () => {
    function sample(name = 'a', type = ProgramValueSlotParameterType.Float, value = 1) {
        return new ProgramValueSlotParameter({
            name,
            type,
            value
        });
    }

    expect(sample().hash()).toBeDefined();
    expect(typeof sample().hash()).toBe('number');
    expect(Number.isInteger(sample().hash())).toBe(true);

    expect(sample('a').hash()).not.toBe(sample('b').hash());

    expect(sample('a', ProgramValueSlotParameterType.UnsignedInteger).hash())
        .not.toBe(sample('a', ProgramValueSlotParameterType.Float).hash());
});