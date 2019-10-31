import List from "../../../core/collection/List.js";
import { BinaryClassSerializationAdapter } from "../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { StoryTrigger } from "./StoryTrigger.js";
import { StoryAction } from "../action/StoryAction.js";

export class StoryTriggerSet {
    constructor() {
        /**
         *
         * @type {List<StoryTrigger>}
         */
        this.elements = new List();
    }
}

StoryTriggerSet.typeName = "StoryTriggerSet";


export class StoryTriggerSetSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = StoryTriggerSet;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {StoryTriggerSet} value
     */
    serialize(buffer, value) {
        const elements = value.elements;

        const n = elements.length;

        buffer.writeUintVar(n);

        for (let i = 0; i < n; i++) {
            const trigger = elements.get(i);

            //serialize code
            buffer.writeUTF8String(trigger.code);

            //serialize active setting
            buffer.writeUint8(trigger.active.getValue() ? 1 : 0);

            //serialize actions
            const actions = trigger.actions;
            const numActions = actions.length;

            buffer.writeUintVar(numActions);

            for (let j = 0; j < numActions; j++) {
                const action = actions.get(j);

                buffer.writeUTF8String(action.type);

                // TODO this can be optimized significantly
                buffer.writeUTF8String(JSON.stringify(action.parameters));
            }
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {StoryTriggerSet} value
     */
    deserialize(buffer, value) {
        const numElements = buffer.readUintVar();

        //clear out existing triggers
        value.elements.reset();

        for (let i = 0; i < numElements; i++) {
            //read individual triggers
            const trigger = new StoryTrigger();

            //read trigger condition code
            trigger.code = buffer.readUTF8String();

            //read active setting
            trigger.active.set(buffer.readUint8() !== 0);

            //read number of actions
            const numActions = buffer.readUintVar();

            for (let j = 0; j < numActions; j++) {
                const action = new StoryAction();

                //read action type
                const type = buffer.readUTF8String();

                const paramString = buffer.readUTF8String();

                const params = JSON.parse(paramString);

                action.type = type;
                action.parameters = params;

                trigger.actions.add(action);
            }

            value.elements.add(trigger);
        }
    }
}
