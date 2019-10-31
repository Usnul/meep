import { StoryAction } from "../action/StoryAction.js";
import { assert } from "../../../core/assert.js";

export class StoryPageChoice {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.label = "";

        /**
         *
         * @type {string}
         */
        this.id = "";

        /**
         *
         * @type {StoryAction[]}
         */
        this.actions = [];

        /**
         *
         * @type {String[]}
         */
        this.classList = [];

        /**
         * If a choice is implicit - option will not be shown and instead the choice will be taken implicitly
         * Only one implicit choice is allowed per page
         * @type {boolean}
         */
        this.implicit = false;
    }

    /**
     *
     * @param j
     * @returns {StoryPageChoice}
     */
    static fromJSON(j) {
        const r = new StoryPageChoice();

        r.fromJSON(j);

        return r;
    }

    fromJSON(
        {
            id = "",
            label = "select",
            actions,
            classList = [],
            implicit = false
        }
    ) {

        assert.typeOf(id, 'string', 'id');
        assert.typeOf(label, 'string', 'label');
        assert.ok(Array.isArray(actions), 'actions parameter must be an array, instead was something else');

        assert.typeOf(implicit, 'boolean', 'implicit');

        this.id = id;

        this.label = label;

        this.classList = classList;

        this.implicit = implicit;

        this.actions = actions.map(a => {
            const action = new StoryAction();

            action.fromJSON(a);

            return action;
        });
    }
}
