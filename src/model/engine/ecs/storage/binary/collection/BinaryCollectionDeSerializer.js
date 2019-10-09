import { BinaryBuffer } from "../../../../../core/binary/BinaryBuffer.js";
import { BinaryCollectionHeaderCodec, BinaryCollectionHeaderLayout } from "./BinaryCollectionHeaderCodec.js";
import { assert } from "../../../../../core/assert.js";
import { IllegalStateException } from "../../../../../core/fsm/exceptions/IllegalStateException.js";
import { objectKeyByValue } from "../../../../../core/model/ObjectUtils.js";

/**
 *
 * @enum {number}
 */
const State = {
    Initial: 0,
    Ready: 1
};

/**
 *
 * @returns {Array}
 */
function makeEmptyArray() {
    return [];
}

export class BinaryCollectionDeSerializer {
    constructor() {
        /**
         * @private
         * @type {BinarySerializationRegistry}
         */
        this.registry = null;

        /**
         * @private
         * @type {BinaryBuffer}
         */
        this.buffer = null;

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__dictionaryEnabled = false;
        /**
         *
         * @type {boolean}
         * @private
         */
        this.__upgradeRequired = false;

        /**
         * @private
         * @type {number}
         */
        this.elementCount = 0;

        /**
         * @private
         * @type {number}
         */
        this.elementIndex = 0;

        /**
         * @private
         * @type {number}
         */
        this.startAddress = 0;

        /**
         * @private
         * @type {BinaryClassSerializationAdapter}
         */
        this.adapter = null;

        /**
         * @private
         * @type {BinaryClassUpgrader[]}
         */
        this.upgraders = null;

        /**
         *
         * @type {BinaryBuffer}
         * @private
         */
        this.__upgradeBuffer0 = new BinaryBuffer();
        /**
         *
         * @type {BinaryBuffer}
         * @private
         */
        this.__upgradeBuffer1 = new BinaryBuffer();

        /**
         * @private
         * @type {State}
         */
        this.state = State.Initial;
    }


    /**
     *
     * @param {BinarySerializationRegistry} registry
     */
    setRegistry(registry) {
        assert.notEqual(registry, undefined, 'registry is undefined');
        assert.notEqual(registry, null, 'registry is null');

        this.registry = registry;
    }

    /**
     *
     * @returns {BinarySerializationRegistry}
     */
    getRegistry() {
        return this.registry;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    setBuffer(buffer) {
        assert.notEqual(buffer, undefined, 'buffer is undefined');
        assert.notEqual(buffer, null, 'buffer is null');

        this.buffer = buffer;
    }

    /**
     *
     * @returns {number}
     */
    getElementCount() {
        return this.elementCount;
    }

    /**
     *
     * @returns {number}
     */
    getElementIndex() {
        return this.elementIndex;
    }

    /**
     * @template
     * @returns {Class<T>}
     */
    getElementClass() {
        return this.adapter.getClass();
    }

    /**
     *
     * @param {function(string,Class, BinaryClassSerializationAdapter):[]} [adapterOptionsSupplier]
     */
    initialize({ adapterOptionsSupplier = makeEmptyArray } = {}) {
        assert.typeOf(adapterOptionsSupplier, 'function', 'adapterOptionsSupplier');

        if (this.state !== State.Initial) {
            throw new IllegalStateException(`Expected state to be Initial, instead was ${objectKeyByValue(State, this.state)}`);
        }

        const buffer = this.buffer;

        const registry = this.registry;

        assert.notEqual(buffer, null, 'buffer is null');
        assert.notEqual(registry, null, 'registry is null');

        const className = buffer.readUTF8String();

        const adapter = registry.getAdapter(className);

        if (adapter === undefined) {
            throw new Error(`No serialization adapter found for '${className}'`);
        }

        this.adapter = adapter;

        const adapterOptions = adapterOptionsSupplier(className, adapter.getClass(), adapter);

        assert.ok(Array.isArray(adapterOptions), 'adapterOptionsSupplier must produce an array, instead got something else');

        //initialize adapter with options
        this.adapter.initialize.apply(this.adapter, adapterOptions);

        const header = buffer.readUint32();

        const headerValues = [];

        BinaryCollectionHeaderCodec.decode(header, headerValues);

        //read serialized version
        const version = headerValues[BinaryCollectionHeaderLayout.Version];

        //read flags
        this.__dictionaryEnabled = headerValues[BinaryCollectionHeaderLayout.Dictionary] !== 0;

        //read element count
        this.elementCount = buffer.readUint32();

        //set element index to 0
        this.elementIndex = 0;

        //check if data needs to be upgraded
        if (version > adapter.getVersion()) {
            throw new Error(`${className} data version is ${version}, which is greater than the registered serialization adapter version(=${adapter.getVersion()})`);
        }

        if (version < adapter.getVersion()) {
            this.__upgradeRequired = true;

            //data needs to be upgraded
            const upgradersChain = registry.getUpgradersChain(className, version, adapter.getVersion());

            if (upgradersChain === null) {
                throw new Error(`No upgrade chain exists for class '${className}' from version ${version} to current adapter version ${adapter.getVersion()}`);
            }

            this.upgraders = upgradersChain;
        } else {
            this.__upgradeRequired = false;
        }

        //
        this.__upgradeBuffer0.position = 0;
        this.__upgradeBuffer1.position = 0;

        this.startAddress = this.buffer.position;


        //Update internal state
        this.state = State.Ready;
    }

    finalize() {

        if (this.state !== State.Ready) {
            throw new IllegalStateException(`Expected state to be Ready, instead was ${objectKeyByValue(State, this.state)}`);
        }

        //finalize current adapter
        this.adapter.finalize();

        //Update internal state
        this.state = State.Initial;
    }

    /**
     * @private
     * @returns T
     */
    readPlainValue() {
        let buffer = this.buffer;

        if (this.__upgradeRequired) {
            //binary representation requires an upgrade
            const tempBuffers = [this.__upgradeBuffer0, this.__upgradeBuffer1];

            let sourceBuffer = buffer;
            let targetBuffer = this.__upgradeBuffer0;

            const upgraders = this.upgraders;

            const upgraderCount = upgraders.length;

            //perform upgrade
            for (
                let i = 0;
                i < upgraderCount;
                i++, sourceBuffer = targetBuffer, targetBuffer = tempBuffers[i % 2]
            ) {
                const upgrader = upgraders[i];

                targetBuffer.position = 0;

                upgrader.upgrade(sourceBuffer, targetBuffer);

                //re-wing target buffer so it can be read
                targetBuffer.position = 0;
            }

            buffer = sourceBuffer;
        }

        const Klass = this.adapter.getClass();

        const value = new Klass();

        this.adapter.deserialize(buffer, value);

        return value;
    }

    /**
     * @template T
     * @returns {{value: T, key: number}}
     */
    read() {
        const buffer = this.buffer;

        //read key
        const key = buffer.readUintVar();
        let value = null;

        if (this.__dictionaryEnabled) {
            //read record header
            const header0 = buffer.readUint8();

            if (header0 === 0) {
                //plain record
                value = this.readPlainValue();

            } else {
                //dictionary record

                const headerType = header0 & 0x3;

                let header;

                if (headerType === 1) {
                    header = header0;
                } else if (headerType === 2) {
                    //16 bit header
                    buffer.position--;

                    header = buffer.readUint16LE();
                } else if (headerType === 3) {
                    buffer.position--;

                    header = buffer.readUint32LE();
                }

                const offset = header >> 2;

                //read address
                const address = offset + this.startAddress;

                const recordEnd = buffer.position;

                buffer.position = address;

                value = this.readPlainValue();

                //restore position
                buffer.position = recordEnd;
            }
        } else {
            value = this.readPlainValue();
        }


        this.elementIndex++;

        return {
            key,
            value
        };
    }

}
