import { System } from "../../ecs/System.js";
import { StoryTriggerSet } from "./StoryTriggerSet.js";
import { Blackboard } from "../../intelligence/blackboard/Blackboard.js";


class StoryTriggerContext {
    /**
     *
     * @param {StoryTrigger} trigger
     * @param {StoryTriggerSetContext} context
     */
    constructor({ trigger, context }) {
        this.trigger = trigger;
        this.context = context;
    }

    tryExecute() {
        const trigger = this.trigger;

        if (!trigger.active.getValue()) {
            //trigger is inactive
            return;
        }

        const condition = trigger.condition;

        if (!condition.getExpression().getValue()) {
            //trigger condition is not satisfied
            return;
        }

        const system = this.context.system;

        /**
         *
         * @type {StoryActionExecutor}
         */
        const executor = system.executor;

        executor.initialize(system.entityManager.dataset);

        executor.setTarget(this.context.entity);

        trigger.actions.forEach(a => executor.execute(a));
    }

    link() {
        const trigger = this.trigger;

        //make sure trigger is compiled
        trigger.compile();

        const condition = trigger.condition;

        condition.link(this.context.blackboard);

        condition.getExpression().onChanged.add(this.tryExecute, this);

        trigger.active.onChanged.add(this.tryExecute, this);

    }

    unlink() {
        const trigger = this.trigger;

        const condition = trigger.condition;

        condition.unlink(this.context.blackboard);

        condition.getExpression().onChanged.remove(this.tryExecute, this);

        trigger.active.onChanged.remove(this.tryExecute, this);
    }
}

class StoryTriggerSetContext {
    /**
     *
     * @param {StoryTriggerSet} triggers
     * @param {Blackboard} blackboard
     * @param {number} entity
     * @param {StoryTriggerSetSystem} system
     */
    constructor({ triggers, blackboard, entity, system }) {
        this.triggers = triggers;
        this.blackboard = blackboard;
        this.entity = entity;
        this.system = system;


        /**
         *
         * @type {Map<StoryTrigger, StoryTriggerContext>}
         */
        this.contexts = new Map();
    }

    /**
     * @private
     * @param {StoryTrigger} trigger
     */
    linkTrigger(trigger) {
        const context = new StoryTriggerContext({ trigger, context: this });

        this.contexts.set(trigger, context);

        context.link();
    }

    /**
     * @private
     * @param {StoryTrigger} trigger
     */
    unlinkTrigger(trigger) {
        const context = this.contexts.get(trigger);

        context.unlink();

        this.contexts.delete(trigger);
    }

    link() {
        const triggers = this.triggers;

        triggers.elements.forEach(this.linkTrigger, this);

        triggers.elements.on.added.add(this.linkTrigger, this);
        triggers.elements.on.removed.add(this.unlinkTrigger, this);
    }

    unlink() {

        const triggers = this.triggers;
        triggers.elements.forEach(this.unlinkTrigger, this);

        triggers.elements.on.added.remove(this.linkTrigger, this);
        triggers.elements.on.removed.remove(this.unlinkTrigger, this);
    }
}

export class StoryTriggerSetSystem extends System {

    /**
     *
     * @param {StoryActionExecutor} executor
     */
    constructor(executor) {
        super();

        this.componentClass = StoryTriggerSet;

        this.dependencies = [Blackboard];

        /**
         * @type {StoryActionExecutor}
         */
        this.executor = executor;

        /**
         * @private
         * @type {StoryTriggerSetContext[]}
         */
        this.contexts = [];
    }

    /**
     *
     * @param {StoryTriggerSet} triggers
     * @param {Blackboard} blackboard
     * @param {number} entity
     */
    link(triggers, blackboard, entity) {
        const ctx = new StoryTriggerSetContext({ triggers, blackboard, entity, system: this });

        this.contexts[entity] = ctx;

        ctx.link();
    }

    /**
     *
     * @param {StoryTriggerSet} triggers
     * @param {Blackboard} blackboard
     * @param {number} entity
     */
    unlink(triggers, blackboard, entity) {

        const ctx = this.contexts[entity];

        if (ctx === undefined) {
            console.error(`Context for entity '${entity}' not found`, triggers, blackboard, entity);
            return;
        }

        delete this.contexts[entity];

        ctx.unlink();
    }
}
