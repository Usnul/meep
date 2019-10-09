/**
 * User: Alex Goldring
 * Date: 3/27/2014
 * Time: 9:32 PM
 */
import Element from './Element';

const Vertex = function (x, y, z) {
    this.x = 0 || x;
    this.y = 0 || y;
    this.z = 0 || z;
};
Vertex.prototype = new Element();
Vertex.prototype.clone = function () {
    return new Vertex(this.x, this.y, this.z);
};
Vertex.prototype.set = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
};
Vertex.prototype.add = function (other) {
    return this.set(this.x + other.x, this.y + other.y, this.z + other.z);
};
Vertex.prototype.sub = function (other) {
    return this.set(this.x - other.x, this.y - other.y, this.z - other.z);
};
Vertex.prototype.scale = function (factor) {
    return this.set(this.x * factor, this.y * factor, this.z * factor);
};
Vertex.prototype.distanceTo = function (other) {
    return this.clone().sub(other).length();
};
/**
 * @returns {number}
 */
Vertex.prototype.length = function () {
    const z = this.z;
    const y = this.y;
    const x = this.x;
    return Math.sqrt(x * x + y * y + z * z);
};
export default Vertex;
