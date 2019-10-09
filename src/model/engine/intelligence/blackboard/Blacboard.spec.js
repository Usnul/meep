import { Blackboard, BlackboardSerializationAdapter } from "./Blackboard.js";
import { BinaryBuffer } from "../../../core/binary/BinaryBuffer.js";

test('to/from binary buffer serialization', () => {
    const bb = new Blackboard();

    bb.acquireNumber('a/b/c').set(42.3);

    bb.acquireBoolean('a.true').set(true);
    bb.acquireBoolean('a.false').set(false);

    const buffer = new BinaryBuffer();

    const adapter = new BlackboardSerializationAdapter();

    adapter.initialize();
    adapter.serialize(buffer, bb);

    const ba = new Blackboard();
    buffer.position = 0;

    adapter.deserialize(buffer, ba);

    expect(ba.acquireNumber('a/b/c').getValue()).toBe(42.3);
    expect(ba.acquireBoolean('a.true').getValue()).toBe(true);
    expect(ba.acquireBoolean('a.false').getValue()).toBe(false);
});
