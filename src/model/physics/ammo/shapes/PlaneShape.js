/**
 * Created by Alex on 19/02/14.
 */
import Shape from './Shape';

const PlaneShape = function (x, y, z, w) {
    Shape.call(this);
    this.type = "plane";
    //up axis definition
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    //offset along the up axis
    this.w = w || 0;
};
PlaneShape.prototype = new Shape();
export default PlaneShape;
