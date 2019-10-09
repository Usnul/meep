export class DataType {
    constructor() {
        /**
         *
         * @type {number}
         */
        this.id = 0;

        /**
         *
         * @type {string}
         */
        this.name = "";
    }
}

/**
 *
 * @param {number} id
 * @param {string} name
 */
DataType.from = function (id, name) {
    const r = new DataType();

    r.id = id;
    r.name = name;

    return r;
};
