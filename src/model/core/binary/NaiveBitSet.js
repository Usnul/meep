/**
 * Used for testing of BitSet correctness and performance
 * NOTE: Not intended for production. Use {@link BitSet} instead
 */
export class NaiveBitSet {
    constructor() {
        this.data = [];
    }

    nextSetBit(fromIndex) {
        let i;

        for (i = fromIndex; i < this.data.length; i++) {
            if (this.data[i] === true) {
                return i;
            }
        }

        return -1;
    }

    nextClearBit(fromIndex) {
        let i;

        for (i = fromIndex; i < this.data.length; i++) {
            if (this.data[i] !== true) {
                return i;
            }
        }

        return i;
    }

    previousSetBit(fromIndex) {
        let i;

        for (i = fromIndex; i >= 0; i--) {
            if (this.data[i] === true) {
                return i;
            }
        }

        return -1;
    }

    set(bitIndex, value) {
        this.data[bitIndex] = value;
    }

    get(bitIndex) {
        return (this.data[bitIndex] === true);
    }

    size() {
        return this.data.length;
    }

    setCapacity(n) {
        //do nothing
    }

    capacity() {
        return this.data.length;
    }

    reset() {
        this.data = [];
    }
}