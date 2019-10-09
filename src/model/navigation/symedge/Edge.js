/**
 * User: Alex Goldring
 * Date: 3/27/2014
 * Time: 9:32 PM
 */
import Element from './Element';

const Edge = function (v0, v1) {
    this.v0 = v0 || null;
    this.v1 = v1 || null;
};
Edge.prototype = new Element();
Edge.prototype.isPortal = function () {
    //edge is a portal if it has a face on either side, this results in SymEdge having a reflection
    return this.symedge.sym() != null;
};
Edge.prototype.length = function () {
    return this.v0.distanceTo(this.v1);
};
Edge.prototype.midPoint = function () {
    return this.v0.clone().add(this.v1).scale(1 / 2);
};
export default Edge;
