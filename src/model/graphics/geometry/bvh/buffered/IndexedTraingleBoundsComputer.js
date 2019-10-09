/**
 * Created by Alex on 29/05/2016.
 */
import { max3, min3 } from '../../../../core/math/MathUtils';

const makeTriangle = (function () {

    let x0, y0, z0, x1, y1, z1;

    let aX, aY, aZ, bX, bY, bZ, cX, cY, cZ;

    function setFaceBounds(a, b, c, vertices, callback) {
        aX = vertices[a];
        aY = vertices[a + 1];
        aZ = vertices[a + 2];

        bX = vertices[b];
        bY = vertices[b + 1];
        bZ = vertices[b + 2];

        cX = vertices[c];
        cY = vertices[c + 1];
        cZ = vertices[c + 2];


        x0 = min3(aX, bX, cX);
        y0 = min3(aY, bY, cY);
        z0 = min3(aZ, bZ, cZ);
        x1 = max3(aX, bX, cX);
        y1 = max3(aY, bY, cY);
        z1 = max3(aZ, bZ, cZ);

        return callback(x0, y0, z0, x1, y1, z1);
    }

    return setFaceBounds;
})();

export default {
    compute: makeTriangle
};