import { BlackboardTrigger } from "../../../core/model/reactive/trigger/BlackboardTrigger.js";
import List from "../../../core/collection/List.js";
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";

export class StoryTrigger {
    constructor() {
        /**
         *
         * @type {string}
         */
        this.code = "";

        /**
         *
         * @type {BlackboardTrigger}
         */
        this.condition = new BlackboardTrigger();

        /**
         *
         * @type {List<StoryAction>}
         */
        this.actions = new List();

        /**
         * Trigger only fires if it is active
         * @type {ObservedBoolean}
         */
        this.active = new ObservedBoolean(true);
    }

    compile() {
        const condition = this.condition;

        if (condition.code !== this.code) {

            if (condition.isLinked) {
                console.warn("Trigger is currently linked, re-compilation will likely break the trigger in current session");
            }

            condition.code = this.code;

            condition.compile();
        }
    }
}
