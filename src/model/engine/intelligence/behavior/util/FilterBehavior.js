import { SequenceBehavior } from "../composite/SequenceBehavior.js";

export class FilterBehavior extends SequenceBehavior {
    constructor() {
        super();

    }

    addChild(child) {
        throw new Error('Direct injection of children is not allowed, use addCodition and addAction isntead');
    }

    /**
     *
     * @param {Behavior} condition
     */
    addCondition(condition) {
        this.__children.unshift(condition);
    }

    /**
     *
     * @param {Behavior} action
     */
    addAction(action) {
        this.__children.push(action);
    }
}