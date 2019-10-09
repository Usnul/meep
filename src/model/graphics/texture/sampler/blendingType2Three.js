import { AdditiveBlending, MultiplyBlending, NormalBlending, SubtractiveBlending } from "three";
import { BlendingType } from "./BlendingType.js";

/**
 * Converts BlendingType value to blending constant of Three.js
 * @param {BlendingType} blendingType
 * @returns {number}
 */
export function blendingType2three(blendingType) {

    let result;

    if (blendingType === BlendingType.Normal) {
        result = NormalBlending;
    } else if (blendingType === BlendingType.Add) {
        result = AdditiveBlending;
    } else if (blendingType === BlendingType.Subtract) {
        result = SubtractiveBlending;
    } else if (blendingType === BlendingType.Multiply) {
        result = MultiplyBlending;
    } else {
        throw new TypeError(`Unsupported blending type ${blendingType}`);
    }

    return result;
}