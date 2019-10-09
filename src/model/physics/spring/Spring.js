/**
 *
 * @param {number} displacement
 * @param {number} stiffness
 * @return {number}
 */
export function computeHookeForce(displacement, stiffness) {
    return -stiffness * displacement;
}