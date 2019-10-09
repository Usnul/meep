/**
 * User: Alex Goldring
 * Date: 22/6/2014
 * Time: 22:05
 */


import Vector3 from '../../../core/geom/Vector3';

class HeadsUpDisplay {
    /**
     *
     * @param worldOffset
     */
    constructor({
                    worldOffset = new Vector3()
                } = {}) {

        /**
         *
         * @type {Vector3}
         */
        this.worldOffset = worldOffset;

        /**
         * Whether or not world offset should be transformed using {@link Transform}
         * @type {boolean}
         */
        this.transformWorldOffset = true;
    }
}

HeadsUpDisplay.typeName = "HeadsUpDisplay";
HeadsUpDisplay.serializable = false;

export default HeadsUpDisplay;
