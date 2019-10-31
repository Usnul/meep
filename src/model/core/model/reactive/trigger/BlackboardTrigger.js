import { ReactiveTrigger } from "./ReactiveTrigger.js";

export class BlackboardTrigger {
    constructor() {
        /**
         * @type {String|null}
         */
        this.code = null;

        /**
         *
         * @type {boolean}
         */
        this.isLinked = false;
    }

    /**
     *
     * @returns {ReactiveExpression}
     */
    getExpression(){
        return this.trigger.expression;
    }

    /**
     *
     * @returns {boolean}
     */
    isCompiled() {
        return this.trigger !== undefined;
    }

    compile() {
        this.trigger = new ReactiveTrigger(this.code);
    }

    /**
     *
     * @param {Blackboard} blackboard
     */
    link(blackboard) {
        if (this.isLinked) {
            //already linked
            return;
        }

        this.isLinked = true;

        if (!this.isCompiled()) {
            this.compile();
        }

        this.trigger.traverseReferences(function (ref) {
            const value = blackboard.acquire(ref.name, ref.dataType);

            ref.connect(value);
        });
    }

    /**
     *
     * @param {Blackboard} blackboard
     */
    unlink(blackboard) {
        if (!this.isLinked) {
            //not linked
            return;
        }

        this.isLinked = false;

        this.trigger.traverseReferences(r => {
            r.disconnect();

            blackboard.release(r.name);
        });
    }

}
