/**
 * User: Alex Goldring
 * Date: 3/26/2014
 * Time: 11:23 PM
 */
const SymEdge = function () {
    /**
     * @type {SymEdge}
     */
    this._next = null;
    /**
     * @type {SymEdge}
     */
    this._rotate = null;
    /**
     *
     * @type {Vertex}
     */
    this._vertex = null;
    /**
     *
     * @type {Edge}
     */
    this._edge = null;
    /**
     *
     * @type {Face}
     */
    this._face = null;
};
//traversal operations
SymEdge.prototype.nxt = function () {
    return this._next;
};
SymEdge.prototype.pri = function () {
    return this._rotate._next._rotate;
};
SymEdge.prototype.rot = function () {
    return this._rotate;
};
SymEdge.prototype.ret = function () {
    return this._next._rotate._next;
};
SymEdge.prototype.sym = function () {
    return this._next._rotate;
};
//accessors for adjacent elements
SymEdge.prototype.vtx = function () {
    return this._vertex;
};
SymEdge.prototype.edg = function () {
    return this._edge;
};
SymEdge.prototype.fac = function () {
    return this._face;
};
export default SymEdge;
