import Vector2 from "../../../core/geom/Vector2.js";
import { BitSet } from "../../../core/binary/BitSet.js";

export class AreaTrigger {
    constructor() {
        this.size = new Vector2(1, 1);
        this.data = new BitSet();

        this.data.set(0, true);

        /**
         *
         * @type {TriggerAction[]}
         */
        this.actions = [];
    }
}

AreaTrigger.typeName = "AreaTrigger";


