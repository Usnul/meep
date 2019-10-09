/**
 * Created by Alex on 22/02/2017.
 */


import MsgPackCodec from './MsgPackCodec';

import Storage from '../Storage';
import { byteArrayToString, stringToByteArray } from "../../../core/binary/ByteArrayTools";
import { InMemoryLocalStorage } from "./InMemoryLocalStorage.js";


class LocalStorage extends Storage {
    constructor(namespace, services) {
        super();
        this.namespace = namespace;
        this.services = services;

        this.compressionLevel = 2;
        this.compressionEnabled = false;

        this.codec = new MsgPackCodec();

        try {
            console.log('Accessing Window.localStorage...');
            this.localStorage = window.localStorage;
            console.log('LocalStorage acquired');
        } catch (e) {
            console.error(`Failed to get localStorage:`, e);

            // This fallback allows the system to continue functioning at least
            this.localStorage = new InMemoryLocalStorage();

            console.warn(`Falling back to in-memory storage`);
        }

        const item = this.localStorage.getItem(this.namespace + "-list");
        let stored;

        try {
            stored = JSON.parse(item);
        } catch (e) {
            console.error('Failed to parse loaded item:', e, item);
            console.warn('Ignoring previously stored data');
            stored = null;
        }

        if (stored !== null && typeof stored === "object" && typeof stored.length === "number") {
            this.__list = stored;
        } else {
            this.__list = [];
        }
    }

    makeObjectId(key) {
        return this.namespace + '-item-' + key;
    }

    storeBinary(key, value, resolve, reject, progress) {
        const self = this;

        function store(data) {
            const compressedUint8Array = new Uint8Array(data.length);
            compressedUint8Array.set(data, 0);

            if (compressedUint8Array.length !== value.length) {
                console.log("Compressed size:", compressedUint8Array.length, "bytes, original ", value.length, ".", (compressedUint8Array.length / value.length * 100).toFixed(2) + "% of the original");
            }

            const compressedString = byteArrayToString(compressedUint8Array);

            self.localStorage.setItem(self.makeObjectId(key), compressedString);

            if (self.__list.indexOf(key) === -1) {
                //update the list
                self.__list.push(key);
                self.localStorage.setItem(self.namespace + "-list", JSON.stringify(self.__list));
            }

            if (typeof resolve === "function") {
                resolve();
            }
        }

        if (this.compressionEnabled) {
            const compressionService = this.services.compression;

            compressionService
                .encode(value, this.compressionLevel)
                .then(store, reject);
        } else {
            store(value);
        }
    }

    store(key, value, resolve, reject, progress) {
        const rawData = this.codec.encode(value);

        this.storeBinary(key, rawData, resolve, reject, progress);
    }

    loadBinary(key, resolve, reject, progress) {

        let compressedString = this.localStorage.getItem(this.makeObjectId(key));

        if (compressedString === null) {
            //no data
            resolve(new ArrayBuffer(0));
            return;
        }

        const uint8array = stringToByteArray(compressedString);

        const data = uint8array.buffer;
        // console.log("compressedBytes", compressedBytes);

        if (this.compressionEnabled) {
            const compressionService = this.services.compression;

            compressionService.decode(data).then(resolve, reject);
        } else {
            resolve(data);
        }
    }

    load(key, resolve, reject, progress) {
        const codec = this.codec;

        this.loadBinary(key, function (binary) {
            let result;

            try {
                result = codec.decode(new Uint8Array(binary));
            } catch (e) {
                reject(e);
            }

            resolve(result);
        }, reject, progress);
    }

    list(resolve, reject) {
        resolve(this.__list);
    }
}

export default LocalStorage;
