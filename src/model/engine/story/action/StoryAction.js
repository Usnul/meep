import { StoryActionType } from "./StoryActionType.js";
import { assert } from "../../../core/assert.js";

export class StoryAction {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.type = StoryActionType.Unknown;

        /**
         *
         * @type {Object}
         */
        this.parameters = {};
    }

    /**
     *
     * @param j
     * @returns {StoryAction}
     */
    static fromJSON(j) {
        const r = new StoryAction();

        r.fromJSON(j);

        return r;
    }

    fromJSON({ type, parameters }) {
        assert.ok(Object.values(StoryActionType).includes(type), `type value(=${type}) is invalid, valid values are: ${Object.values(StoryActionType).join(', ')}`);

        this.type = type;
        this.parameters = parameters;
    }
}
