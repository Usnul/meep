/**
 * Created by Alex on 11/10/2016.
 */


import { Vector3 as ThreeVector3 } from 'three';


const projectInWorldSpace = (function () {
    const corners = [
        new ThreeVector3(-1, -1, 0),
        new ThreeVector3(-1, -1, 0),

        new ThreeVector3(-1, 1, 0),
        new ThreeVector3(-1, 1, 0),

        new ThreeVector3(1, -1, 0),
        new ThreeVector3(1, -1, 0),

        new ThreeVector3(1, 1, 0),
        new ThreeVector3(1, 1, 0)
    ];


    /**
     *
     * @param {Number} nearZ
     * @param {Number} farZ
     * @param {THREE.Camera} camera
     * @param {THREE.Matrix4} matrixWorldInverse
     * @param {function} callback
     */
    function projectInWorldSpace(nearZ, farZ, camera, callback) {
        corners[0].set(-1, -1, nearZ);
        corners[1].set(-1, -1, farZ);

        corners[2].set(-1, 1, nearZ);
        corners[3].set(-1, 1, farZ);

        corners[4].set(1, -1, nearZ);
        corners[5].set(1, -1, farZ);

        corners[6].set(1, 1, nearZ);
        corners[7].set(1, 1, farZ);

        //compute corners of view frustum in light space
        let x0 = Number.POSITIVE_INFINITY;
        let y0 = Number.POSITIVE_INFINITY;
        let z0 = Number.POSITIVE_INFINITY;

        let x1 = Number.NEGATIVE_INFINITY;
        let y1 = Number.NEGATIVE_INFINITY;
        let z1 = Number.NEGATIVE_INFINITY;


        for (let i = 0; i < 8; i++) {
            const corner = corners[i];
            corner.unproject(camera);

            if (corner.x < x0) {
                x0 = corner.x;
            }
            if (corner.x > x1) {
                x1 = corner.x;
            }

            if (corner.y < y0) {
                y0 = corner.y;
            }
            if (corner.y > y1) {
                y1 = corner.y;
            }

            if (corner.z < z0) {
                z0 = corner.z;
            }
            if (corner.z > z1) {
                z1 = corner.z;
            }
        }

        callback(x0, y0, z0, x1, y1, z1);
    }

    return projectInWorldSpace;
})();

const project = (function () {
    const corners = [
        new ThreeVector3(-1, -1, 0),
        new ThreeVector3(-1, -1, 0),

        new ThreeVector3(-1, 1, 0),
        new ThreeVector3(-1, 1, 0),

        new ThreeVector3(1, -1, 0),
        new ThreeVector3(1, -1, 0),

        new ThreeVector3(1, 1, 0),
        new ThreeVector3(1, 1, 0)
    ];


    /**
     *
     * @param {Number} nearZ
     * @param {Number} farZ
     * @param {THREE.Camera} camera
     * @param {THREE.Matrix4} matrixWorldInverse
     * @param {function} callback
     */
    function project(nearZ, farZ, camera, matrixWorldInverse, callback) {
        corners[0].set(-1, -1, nearZ);
        corners[1].set(-1, -1, farZ);

        corners[2].set(-1, 1, nearZ);
        corners[3].set(-1, 1, farZ);

        corners[4].set(1, -1, nearZ);
        corners[5].set(1, -1, farZ);

        corners[6].set(1, 1, nearZ);
        corners[7].set(1, 1, farZ);

        //compute corners of view frustum in light space
        let x0 = Number.POSITIVE_INFINITY;
        let y0 = Number.POSITIVE_INFINITY;
        let z0 = Number.POSITIVE_INFINITY;

        let x1 = Number.NEGATIVE_INFINITY;
        let y1 = Number.NEGATIVE_INFINITY;
        let z1 = Number.NEGATIVE_INFINITY;


        for (let i = 0; i < 8; i++) {
            const corner = corners[i];
            corner.unproject(camera);
            corner.applyMatrix4(matrixWorldInverse);

            if (corner.x < x0) {
                x0 = corner.x;
            }
            if (corner.x > x1) {
                x1 = corner.x;
            }

            if (corner.y < y0) {
                y0 = corner.y;
            }
            if (corner.y > y1) {
                y1 = corner.y;
            }

            if (corner.z < z0) {
                z0 = corner.z;
            }
            if (corner.z > z1) {
                z1 = corner.z;
            }
        }

        callback(x0, y0, z0, x1, y1, z1);
    }

    return project;
})();

/**
 *
 * @param _x0
 * @param _y0
 * @param _z0
 * @param _x1
 * @param _y1
 * @param _z1
 * @param {Camera} camera
 * @param callback
 */
function unproject(_x0, _y0, _z0, _x1, _y1, _z1, camera, callback) {
    const corners = [
        new ThreeVector3(_x0, _y0, _z0),
        new ThreeVector3(_x0, _y0, _z1),

        new ThreeVector3(_x0, _y1, _z0),
        new ThreeVector3(_x0, _y1, _z1),

        new ThreeVector3(_x1, _y0, _z0),
        new ThreeVector3(_x1, _y0, _z1),

        new ThreeVector3(_x1, _y1, _z0),
        new ThreeVector3(_x1, _y1, _z1)
    ];

    //compute corners of view frustum in light space
    let x0 = Number.POSITIVE_INFINITY;
    let y0 = Number.POSITIVE_INFINITY;
    let z0 = Number.POSITIVE_INFINITY;

    let x1 = Number.NEGATIVE_INFINITY;
    let y1 = Number.NEGATIVE_INFINITY;
    let z1 = Number.NEGATIVE_INFINITY;


    corners.forEach(function (corner) {
        corner.project(camera);

        if (corner.x < x0) {
            x0 = corner.x;
        }
        if (corner.x > x1) {
            x1 = corner.x;
        }

        if (corner.y < y0) {
            y0 = corner.y;
        }
        if (corner.y > y1) {
            y1 = corner.y;
        }

        if (corner.z < z0) {
            z0 = corner.z;
        }
        if (corner.z > z1) {
            z1 = corner.z;
        }
    });

    callback(x0, y0, z0, x1, y1, z1);
}

export default {
    project,
    unproject,
    projectInWorldSpace
};