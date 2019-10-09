/**
 * Created by Alex on 19/02/14.
 */
import Shape from './Shape';

const CapsuleShape = function (options) {
    Shape.call(this);
    this.type = "capsule";
    this.raidus = options.radius || 1;
    this.height = options.height || 1;
};
CapsuleShape.prototype = new Shape();
export default CapsuleShape;
