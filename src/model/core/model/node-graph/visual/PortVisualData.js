import Vector2 from "../../../geom/Vector2.js";

export class PortVisualData {
    constructor() {
        this.id = 0;

        /**
         *
         * @type {Vector2}
         */
        this.position = new Vector2();
    }

    /**
     *
     * @param {PortVisualData} other
     */
    copy(other) {
        this.id = other.id;

        this.position.copy(other.position);
    }

    toJSON() {
        return {
            id: this.id,
            position: this.position.toJSON()
        };
    }

    fromJSON(json) {
        this.id = json.id;
        this.position.fromJSON(json.position);
    }
}
