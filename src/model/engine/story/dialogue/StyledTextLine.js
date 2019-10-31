import { assert } from "../../../core/assert.js";

export class StyledTextLine {
    constructor() {
        /**
         * Localization key
         * @type {String}
         */
        this.key = null;

        /**
         * CSS class list
         * @type {String[]}
         */
        this.classList = [];

        /**
         * CSS styles
         * @type {Object}
         */
        this.style = {};
    }

    /**
     *
     * @param j
     * @returns {StyledTextLine}
     */
    static fromJSON(j) {
        const r = new StyledTextLine();

        r.fromJSON(j);

        return r;
    }

    fromJSON({ key, classList = [], style = {} }) {
        assert.typeOf(key, 'string', 'key');

        this.key = key;
        this.classList = classList;
        this.style = style;
    }
}


const empty = new StyledTextLine();
empty.key = "empty";


/**
 * @readonly
 * @type {StyledTextLine}
 */
StyledTextLine.Empty = Object.freeze(empty);
