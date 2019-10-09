import { StatModifierSource } from "./StatModifierSource.js";
import { assert } from "../../assert.js";


/**
 * Linear polynomial modifier in form of : a*x + b
 * @example if x is 5, and modifier a=3 and b=7 then we get 3*5 + 7 = 23
 */
class LinearModifier {
    /**
     * @param {number} [a=1] gradient (slope)
     * @param {number} [b=0] constant (intercept)
     * @constructor
     */
    constructor(a = 1, b = 0) {
        assert.typeOf(a, 'number', 'a');
        assert.typeOf(b, 'number', 'b');

        /**
         * gradient (slope)
         * @readonly
         * @type {number}
         */
        this.a = a;

        /**
         * constant (intercept)
         * @readonly
         * @type {number}
         */
        this.b = b;

        /**
         *
         * @type {StatModifierSource|number}
         */
        this.source = StatModifierSource.Unknown;

        /**
         * Whenever this modifier is grated by another persistent effect
         * @type {boolean}
         */
        this.transient = false;
    }

    /**
     *
     * @param {LinearModifier} other
     * @returns {boolean}
     */
    equals(other) {
        return this.a === other.a && this.b === other.b && this.source === other.source;
    }
}

export default LinearModifier;