import { BinaryClassSerializationAdapter } from "../BinaryClassSerializationAdapter.js";
import { BinaryClassUpgrader } from "../BinaryClassUpgrader.js";
import { BinarySerializationRegistry } from "../BinarySerializationRegistry.js";
import { BinaryCollectionSerializer } from "./BinaryCollectionSerializer.js";
import { BinaryBuffer } from "../../../../../core/binary/BinaryBuffer.js";
import { computeStringHash } from "../../../../../core/strings/StringUtils.js";
import { BinaryCollectionDeSerializer } from "./BinaryCollectionDeSerializer.js";

class Datum {
    constructor() {
        this.count = 0;
        this.name = "";
    }

    /**
     *
     * @param {number} count
     * @param {string} name
     * @returns {Datum}
     */
    static of(count, name) {
        const datum = new Datum();

        datum.count = count;
        datum.name = name;

        return datum;
    }

    hash() {
        return this.count ^ computeStringHash(this.name);
    }

    /**
     *
     * @param {Datum} other
     * @returns {boolean}
     */
    equals(other) {
        return this.count === other.count && this.name === other.name;
    }
}

class DatumSerializer0 extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        /**
         *
         * @type {Datum}
         */
        this.klass = Datum;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Datum} value
     */
    serialize(buffer, value) {
        buffer.writeUint32(value.count);
        buffer.writeUTF8String(value.name);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Datum} value
     */
    deserialize(buffer, value) {
        value.count = buffer.readUint32();
        value.name = buffer.readUTF8String();
    }
}

class DatumSerializer7 extends BinaryClassSerializationAdapter {

    constructor() {
        super();

        /**
         *
         * @type {Datum}
         */
        this.klass = Datum;
        this.version = 7;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Datum} value
     */
    serialize(buffer, value) {
        buffer.writeUTF8String(value.name);
        buffer.writeFloat64(value.count);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Datum} value
     */
    deserialize(buffer, value) {
        value.name = buffer.readUTF8String();
        value.count = buffer.readFloat64();
    }
}

class DatumUpgrader0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {
        const count = source.readUint32();
        const name = source.readUTF8String();

        target.writeUTF8String(JSON.stringify({
            name,
            count
        }));
    }
}

class DatumUpgrader1_7 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 1;
        this.__targetVersion = 7;
    }

    upgrade(source, target) {
        const json = source.readUTF8String();

        const { name, count } = JSON.parse(json);

        target.writeUTF8String(name);
        target.writeFloat64(count);
    }
}

test("deserialization upgrade", () => {
    const registry = new BinarySerializationRegistry();

    registry.registerAdapter(new DatumSerializer0(), 'Datum');

    const serializer = new BinaryCollectionSerializer();


    const buffer = new BinaryBuffer();

    serializer.setRegistry(registry);
    serializer.setClass('Datum');
    serializer.setBuffer(buffer);


    serializer.initialize();

    serializer.write(13, Datum.of(7, 'hello'));
    serializer.write(17, Datum.of(23, 'kitty'));

    serializer.finalize();

    registry.removeAdapter('Datum');
    registry.registerAdapter(new DatumSerializer7(), 'Datum');

    registry.registerUpgrader('Datum', new DatumUpgrader0_1());
    registry.registerUpgrader('Datum', new DatumUpgrader1_7());

    //de-serialize
    buffer.position = 0;

    const deSerializer = new BinaryCollectionDeSerializer();

    deSerializer.setBuffer(buffer);
    deSerializer.setRegistry(registry);

    deSerializer.initialize();

    const elementCount = deSerializer.getElementCount();

    expect(elementCount).toBe(2);

    const v0 = deSerializer.read();
    const v1 = deSerializer.read();

    deSerializer.finalize();

    expect(v0.key).toBe(13);
    expect(v0.value.count).toBe(7);
    expect(v0.value.name).toBe("hello");

    expect(v1.key).toBe(17);
    expect(v1.value.count).toBe(23);
    expect(v1.value.name).toBe("kitty");
});

test("serialization/deserialization basic consistency", () => {
    const registry = new BinarySerializationRegistry();

    registry.registerAdapter(new DatumSerializer0(), 'Datum');

    const serializer = new BinaryCollectionSerializer();


    const buffer = new BinaryBuffer();

    serializer.setRegistry(registry);
    serializer.setClass('Datum');
    serializer.setBuffer(buffer);


    serializer.initialize();

    serializer.write(13, Datum.of(7, 'hello'));
    serializer.write(17, Datum.of(23, 'kitty'));
    //duplicate record to engage dictionary usage
    serializer.write(18, Datum.of(23, 'kitty'));

    serializer.finalize();

    //de-serialize
    buffer.position = 0;

    const deSerializer = new BinaryCollectionDeSerializer();

    deSerializer.setBuffer(buffer);
    deSerializer.setRegistry(registry);

    deSerializer.initialize();

    const elementCount = deSerializer.getElementCount();

    expect(elementCount).toBe(3);

    const v0 = deSerializer.read();
    const v1 = deSerializer.read();
    const v2 = deSerializer.read();

    deSerializer.finalize();

    expect(v0.key).toBe(13);
    expect(v0.value.count).toBe(7);
    expect(v0.value.name).toBe("hello");

    expect(v1.key).toBe(17);
    expect(v1.value.count).toBe(23);
    expect(v1.value.name).toBe("kitty");

    expect(v2.key).toBe(18);
    expect(v2.value.count).toBe(23);
    expect(v2.value.name).toBe("kitty");
});
