/**
 * @template K,V
 */
class MapEntry {
    /**
     *
     * @param {K} key
     * @param {V} value
     */
    constructor(key, value) {
        /**
         *
         * @type {K}
         */
        this.key = key;
        /**
         *
         * @type {V}
         */
        this.value = value;
    }
}

/**
 * Implements part of {@link Map} interface
 * @template K,V
 * @extends Map
 */
export class HashMap {
    /**
     * @template K, V
     * @param {function(K):number} keyHashFunction
     * @param {function(K,K):boolean} keyEqualityFunction
     */
    constructor({ keyHashFunction, keyEqualityFunction }) {
        /**
         *
         * @type {function(K): number}
         */
        this.keyHashFunction = keyHashFunction;
        /**
         *
         * @type {function(K, K): boolean}
         */
        this.keyEqualityFunction = keyEqualityFunction;

        /**
         * Sparse array of map entries
         * @type {MapEntry[][]}
         */
        this.records = [];

        this.size = 0;
    }

    /**
     *
     * @param {K} key
     * @param {V} value
     */
    set(key, value) {
        const hash = this.keyHashFunction(key);

        let bucket = this.records[hash];

        if (bucket === undefined) {
            bucket = [new MapEntry(key, value)];
            this.records[hash] = bucket;

            this.size++;

            return;
        }

        //check if key already exists
        for (let i = 0, bucketSize = bucket.length; i < bucketSize; i++) {
            const entry = bucket[i];

            const entryKey = entry.key;
            if (entryKey === key || this.keyEqualityFunction(entryKey, key)) {

                entry.value = value;
                return;

            }
        }

        bucket.push(new MapEntry(key, value));
        this.size++;
    }

    /**
     *
     * @param {K} key
     * @returns {V|undefined}
     */
    get(key) {
        const hash = this.keyHashFunction(key);
        const bucket = this.records[hash];

        if (bucket === undefined) {
            return undefined;
        }


        //check if key already exists
        for (let i = 0, bucketSize = bucket.length; i < bucketSize; i++) {
            const entry = bucket[i];

            const entryKey = entry.key;
            if (entryKey === key || this.keyEqualityFunction(entryKey, key)) {

                return entry.value;
            }
        }

        //not found
        return undefined;
    }

    /**
     *
     * @param {K} key
     * @returns {boolean}
     */
    delete(key) {

        const hash = this.keyHashFunction(key);
        const bucket = this.records[hash];

        if (bucket === undefined) {
            return false;
        }


        //check if key already exists
        for (let i = 0, bucketSize = bucket.length; i < bucketSize; i++) {
            const entry = bucket[i];

            const entryKey = entry.key;
            if (entryKey === key || this.keyEqualityFunction(entryKey, key)) {

                if (bucket.length <= 1) {
                    //last element in the bucket
                    delete this.records[hash];
                } else {
                    bucket.splice(i, 1);
                }

                this.size--;
                return true;
            }
        }

        //not found
        return false;
    }

    /**
     *
     * @param {function(message:string, key:K, value:V)} callback
     */
    verifyHashes(callback) {

        let h, i, l;

        const records = this.records;

        for (h in records) {
            if (!records.hasOwnProperty(h)) {
                continue;
            }

            const bucket = records[h];

            for (i = 0, l = bucket.length; i < l; i++) {
                /**
                 * @type {MapEntry<K,V>}
                 */
                const entry = bucket[i];

                //check hash
                const actualHash = this.keyHashFunction(entry.key);

                const storedHash = parseInt(h);

                if (actualHash !== storedHash) {
                    callback(`Hash of key has changed. old=${storedHash}, new=${actualHash}`, entry.key, entry.value);
                }
            }
        }
    }

    /**
     *
     */
    updateHashes() {

        let h, i, l;

        const records = this.records;

        for (h in records) {
            if (!records.hasOwnProperty(h)) {
                continue;
            }

            const bucket = records[h];

            for (i = 0, l = bucket.length; i < l; i++) {
                /**
                 * @type {MapEntry<K,V>}
                 */
                const entry = bucket[i];

                //check hash
                const actualHash = this.keyHashFunction(entry.key);

                const storedHash = parseInt(h);

                if (actualHash !== storedHash) {
                    //remove entry from the bucket

                    bucket.splice(i, 1);
                    //update iterator
                    l--;
                    i--;

                    if (bucket.length === 0) {
                        //delete empty bucket
                        delete records[h];
                    }

                    const newBucket = records[actualHash];
                    if (newBucket === undefined) {
                        records[actualHash] = [entry];
                    } else {
                        newBucket.push(entry);
                    }
                }
            }
        }
    }

    forEach(callback, thisArg) {
        let h, i, l;

        const records = this.records;

        for (h in records) {
            if (!records.hasOwnProperty(h)) {
                continue;
            }

            const bucket = records[h];

            for (i = 0, l = bucket.length; i < l; i++) {
                /**
                 * @type {MapEntry<K,V>}
                 */
                const entry = bucket[i];

                // Signature based on MDN docs of Map.prototype.forEach()
                callback.call(thisArg, entry.value, entry.key, this);
            }
        }
    }

    /**
     *
     * @param {K} key
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== undefined;
    }

    /**
     * Remove all data from the Map
     */
    clear() {
        this.records = [];
        this.size = 0;
    }

    * [Symbol.iterator]() {
        let h, i, l;

        const records = this.records;

        for (h in records) {
            if (!records.hasOwnProperty(h)) {
                continue;
            }

            const bucket = records[h];

            for (i = 0, l = bucket.length; i < l; i++) {
                /**
                 * @type {MapEntry<K,V>}
                 */
                const entry = bucket[i];

                yield  [entry.value, entry.key];
            }
        }

    }

    /**
     *
     * @returns {Iterator<V>}
     */
    values() {
        const entryIterator = this[Symbol.iterator]();

        return {
            next() {
                const n = entryIterator.next();

                if (n.done) {
                    return {
                        done: true,
                        value: undefined
                    };
                } else {
                    return {
                        done: false,
                        value: n.value[0]
                    };
                }

            }
        };
    }
}
