import { assert } from "../../../../../core/assert.js";
import { BinaryCollectionHeaderCodec, BinaryCollectionHeaderLayout } from "./BinaryCollectionHeaderCodec.js";
import { HashMap } from "../../../../../core/collection/HashMap.js";

export class BinaryCollectionSerializer {
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
         * @private
         * @type {BinaryClassSerializationAdapter}
         */
        this.adapter = null;


        /**
         *
         * @type {String}
         */
        this.className = null;

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__dictionaryEnabled = false;

        /**
         * @private
         * @type {number}
         */
        this.elementCount = 0;


        /**
         * @private
         * @type {number}
         */
        this.startAddress = 0;

        /**
         * @private
         * @type {number}
         */
        this.headerAddress = 0;

        /**
         * @private
         * @type {Map<any, number>}
         */
        this.dictionary = new HashMap({
            keyHashFunction(key) {
                return key.hash();
            },
            keyEqualityFunction(k0, k1) {
                if (k0 === k1) {
                    return true;
                } else {
                    return k0.equals(k1);
                }
            }
        });
    }

    /**
     *
     * @param {string} className
     */
    setClass(className) {
        assert.typeOf(className, 'string', 'className');

        this.className = className;
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

    initialize() {
        const className = this.className;

        assert.typeOf(className, 'string', 'className');

        const registry = this.registry;

        this.adapter = registry.getAdapter(className);

        if (this.adapter === undefined) {
            throw new Error(`No adapter for class '${className}'`);
        }

        this.elementCount = 0;

        const buffer = this.buffer;


        //write class name
        buffer.writeUTF8String(className);

        this.headerAddress = buffer.position;

        //write empty header, to be written later
        buffer.writeUint32(0);

        //write placeholder element count
        buffer.writeUint32(0);

        this.startAddress = buffer.position;

        const componentType = this.adapter.getClass();

        //determine if dictionary can be used
        this.__dictionaryEnabled = typeof componentType.prototype.hash === "function"
            && typeof componentType.prototype.equals === "function";

        //clear dictionary
        this.dictionary.clear();
    }

    finalize() {
        const buffer = this.buffer;
        //remember current position
        const endAddress = buffer.position;

        buffer.position = this.headerAddress;

        const headerValues = [];

        headerValues[BinaryCollectionHeaderLayout.Dictionary] = this.__dictionaryEnabled ? 1 : 0;
        headerValues[BinaryCollectionHeaderLayout.Version] = this.adapter.getVersion();

        const header = BinaryCollectionHeaderCodec.encode.apply(null, headerValues);

        //write header
        buffer.writeUint32(header);

        //write element count
        buffer.writeUint32(this.elementCount);

        //restore buffer position
        buffer.position = endAddress;

        //clear dictionary
        this.dictionary.clear();
    }

    /**
     * @template T
     * @param {T} value
     * @private
     */
    writePlainValue(value) {
        this.adapter.serialize(this.buffer, value);
    }

    /**
     * @template T
     * @param {number} key
     * @param {T} value
     */
    write(key, value) {
        const buffer = this.buffer;

        //write key
        buffer.writeUintVar(key);

        if (this.__dictionaryEnabled) {

            const dictionary = this.dictionary;

            let address = dictionary.get(value);

            if (address !== undefined) {

                if (address < 63) {
                    buffer.writeUint8(1 | (address << 2));
                } else {

                    if (address < 16383) {
                        buffer.writeUint16LE(2 | (address << 2));
                    } else if (address < 1073741823) {
                        buffer.writeUint32LE(3 | (address << 2));
                    } else {
                        throw new Error(`Address value is too high(=${address})`);
                    }
                }
            } else {
                buffer.writeUint8(0); //original value

                address = buffer.position - this.startAddress;

                this.writePlainValue(value);

                dictionary.set(value, address);
            }

        } else {
            this.writePlainValue(value);
        }

        this.elementCount++;
    }


}
