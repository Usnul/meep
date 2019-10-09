export function Connection(source, target) {
    this.source = source;
    this.target = target;

    /**
     *
     * @type {Vector2[]}
     */
    this.points = []
}

/**
 *
 * @return {number}
 */
Connection.prototype.length = function () {
    let result = 0;
    const points = this.points;
    const numPoints = points.length;

    if (numPoints > 1) {
        let p0 = points[0];
        for (let i = 1; i < numPoints; i++) {
            let p1 = points[1];

            result += p0.distanceTo(p1);

            p0 = p1;
        }
    }

    return result;
};