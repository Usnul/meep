import { computeStringHash } from "../../../../../core/strings/StringUtils.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../../../core/math/MathUtils.js";
import { ProgramValueSlotParameterType } from "./ProgramValueSlotParameterType.js";

/**
 *
 * @param {ProgramValueSlotParameterType} type
 * @param value
 */
function computeValueHash(type, value) {
    switch (type) {
        case ProgramValueSlotParameterType.Boolean:
            return value ? 0 : 1;
        case ProgramValueSlotParameterType.UnsignedInteger:
            return value;
        case ProgramValueSlotParameterType.Float:
            return computeHashFloat(value);
        case ProgramValueSlotParameterType.FloatVector2:
        case ProgramValueSlotParameterType.FloatVector3:
        case ProgramValueSlotParameterType.FloatVector4:
            return value.hash();

        default:
            throw new TypeError(`Unsupported value type '${type}'`);
    }
}

export class ProgramValueSlotParameter {
    /**
     *
     * @param {string} name
     * @param {ProgramValueSlotParameterType} type
     * @param {number|boolean|Vector2|Vector3|Vector4} value
     */
    constructor({ name, type, value }) {
        /**
         *
         * @type {string}
         */
        this.name = name;
        /**
         *
         * @type {ProgramValueSlotParameterType}
         */
        this.type = type;
        /**
         *
         * @type {number|boolean|Vector2|Vector3|Vector4}
         */
        this.value = value;
    }

    hash() {
        return computeHashIntegerArray(
            computeStringHash(this.name),
            this.type,
            computeValueHash(this.type, this.value)
        );
    }
}