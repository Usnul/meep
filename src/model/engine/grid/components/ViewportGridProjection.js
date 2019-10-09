/**
 * Created by Alex on 28/01/2015.
 */
import { Matrix4 as ThreeMatrix4 } from 'three';

const emptyHash = {};

function ViewportGridProjection(options) {
    if (options === void 0) {
        options = emptyHash;
    }
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.prevX = void 0;
    this.prevY = void 0;
    this.prevProjectionMatrix = new ThreeMatrix4();
    this.snap = options.snap !== void 0 ? options.snap : true;
}

export default ViewportGridProjection;
