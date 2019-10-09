export class InMemoryLocalStorage {
    constructor() {
        this.data = new Map();
    }

    setItem(key, value) {
        this.data.set(key, value);
    }

    getItem(key) {
        return this.data.get(key);
    }
}