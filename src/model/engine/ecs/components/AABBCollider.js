/**
 * Created by Alex on 25/11/2014.
 */


function AABBCollider(options) {
    this.tags = options.tags.slice();
    this.position = {
        x: Number.POSITIVE_INFINITY,
        y: Number.POSITIVE_INFINITY,
        z: Number.POSITIVE_INFINITY
    };
}

export default AABBCollider;
