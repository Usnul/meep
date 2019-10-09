/**
 * Created by Alex on 29/03/2014.
 */



const Path = function (points) {
    this.points = points || [];
    this.markerOffset = 0;
    this.markerIndex = 0;
};
Path.prototype.reset = function () {
    this.markerOffset = 0;
    this.markerIndex = 0;
};
Path.prototype.last = function () {
    return this.points[this.points.length - 1];
};
Path.prototype.move = function (distanceDelta) {
    distanceDelta += this.markerOffset;
    this.markerOffset = 0;
    let marker = this.points[this.markerIndex];
    while (distanceDelta > 0) {
        const next = this.points[this.markerIndex + 1];
        const distance = marker.distanceTo(next);
        if (distanceDelta < distance) {
            this.markerOffset = distanceDelta;
            return;
        } else {
            this.markerIndex++;
            distanceDelta -= distance;
        }
        marker = next;
        if (this.markerIndex >= this.points.length - 1) {
            //reached the end of the path
            this.markerOffset = 0;
            this.markerIndex = this.points.length - 1;
            break;
        }
    }
};
Path.prototype.isComplete = function () {
    return this.markerIndex >= this.points.length - 1;
};
Path.prototype.getCurrentPosition = function () {
    const previousPoint = this.previousPoint();
    const nextPoint = this.nextPoint();
    if (nextPoint == null) {
        return previousPoint;
    }
    return nextPoint.clone().sub(previousPoint).normalize().scale(this.markerOffset).add(previousPoint);
};
Path.prototype.previousPoint = function () {
    return this.points[this.markerIndex];
};
Path.prototype.nextPoint = function () {
    return this.points[this.markerIndex + 1];
};
export default Path;
