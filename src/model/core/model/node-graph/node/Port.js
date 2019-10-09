import { PortDirection } from "./PortDirection.js";

export class Port {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.name = "";

        /**
         * ID uniquely identifies object within some context. Ids are assumed to be immutable
         * @type {number}
         */
        this.id = 0;

        /**
         *
         * @type {PortDirection|number}
         */
        this.direction = PortDirection.Unspecified;

        /**
         *
         * @type {DataType}
         */
        this.dataType = null;
    }
}
