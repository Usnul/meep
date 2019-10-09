/**
 * Created by Alex on 19/02/14.
 */
import Shape from './Shape';

const SphereShape = function (radius) {
    Shape.call(this);
    this.type = "sphere";
    this.radius = radius || 1;
};
SphereShape.prototype = new Shape();
export default SphereShape;
