/**
 * Created by Alex on 12/08/2014.
 */
import Shape from './Shape';

const BoxShape = function (x, y, z) {
    Shape.call(this);
    this.type = "box";
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};
BoxShape.prototype = new Shape();
export default BoxShape;
