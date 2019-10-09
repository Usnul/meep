/**
 *
 * @param {number} size number of points
 * @param {number} dimensions number of dimensions per point
 * @param {Array|Float32Array|Float64Array} data
 * @constructor
 */
function PointSet(size, dimensions, data) {
    this.__data = data;
    this.__size = size;
    this.__dimensions = dimensions;
}

/**
 * Number of points in the set
 * @returns {int}
 */
PointSet.prototype.size = function () {
    return this.__size;
};

/**
 * Number of dimensions for each point
 * @returns {int}
 */
PointSet.prototype.dimension = function () {
    return this.__dimensions;
};

/**
 * get coordinate for a point
 * @param {int} i point index
 * @param {int} j dimension
 * @returns {number}
 */
PointSet.prototype.coord = function (i, j) {
    return this.__data[i * this.__dimensions + j];
};

export { PointSet };