import { BlackboardTrigger } from "../../core/model/reactive/trigger/BlackboardTrigger.js";

export class Achievement {
    constructor() {
        /**
         *
         * @type {String|null}
         */
        this.id = null;
        /**
         *
         * @type {String|null}
         */
        this.condition = null;
        /**
         *
         * @type {String|null}
         */
        this.icon = null;

        /**
         *
         * @type {BlackboardTrigger|null}
         */
        this.trigger = new BlackboardTrigger();

        /**
         * Whether or not achievement is being tracked
         * @type {boolean}
         */
        this.enabled = true;

        /**
         * Secret achievements are not displayed in the UI until unlocked
         * @type {boolean}
         */
        this.secret = false;
    }

    fromJSON({ id, condition, icon, secret = false }) {

        this.id = id;
        this.condition = condition;
        this.icon = icon;


        this.trigger.code = condition;

        this.secret = secret;
    }

    getLocalizationKeyForTitle() {
        return `achievement.${this.id}.title`;
    }

    getLocalizationKeyForDescription() {
        return `achievement.${this.id}.description`;
    }
}
