import Vector2 from "../../../core/geom/Vector2.js";
import { assert } from "../../../core/assert.js";

export class StoryPageImageSpec {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.url = "";

        /**
         *
         * @type {Vector2}
         */
        this.size = new Vector2();
        /**
         *
         * @type {Vector2}
         */
        this.position = new Vector2();
        /**
         *
         * @type {Vector2}
         */
        this.anchor = new Vector2();

        /**
         *
         * @type {{}}
         */
        this.css = {};

        /**
         *
         * @type {String[]}
         */
        this.classList = [];
    }

    /**
     *
     * @param j
     * @returns {StoryPageImageSpec}
     */
    static fromJSON(j) {
        const r = new StoryPageImageSpec();

        r.fromJSON(j);

        return r;
    }

    fromJSON(
        {
            url,
            size = Vector2.one,
            position = Vector2.zero,
            anchor = Vector2.zero,
            css = {},
            classList = []
        }
    ) {

        assert.typeOf(url, 'string', 'url');


        this.url = url;

        this.size.fromJSON(size);
        this.position.fromJSON(position);
        this.anchor.fromJSON(anchor);

        this.css = css;

        this.classList = classList;
    }
}
