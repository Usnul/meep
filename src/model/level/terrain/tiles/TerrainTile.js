/**
 * Created by Alex on 09/11/2014.
 */


import {
    Box3 as ThreeBox3,
    BufferAttribute as ThreeBufferAttribute,
    BufferGeometry as ThreeBufferGeometry,
    Sphere as ThreeSphere,
    Vector3 as ThreeVector3
} from 'three';
import Vector2 from '../../../core/geom/Vector2';
import Vector3 from '../../../core/geom/Vector3';

import ThreeFactory from '../../../graphics/three/ThreeFactory';


import { LeafNode } from '../../../core/bvh2/LeafNode';

import BVHFromBufferGeometry from '../../../graphics/geometry/bvh/buffered/BVHFromBufferGeometry';

import IndexedBinaryBVH from '../../../core/bvh2/binary/IndexedBinaryBVH';
import { BVHGeometryRaycaster } from "../../../graphics/geometry/bvh/buffered/BVHGeometryRaycaster.js";
import ObservedInteger from "../../../core/model/ObservedInteger.js";

function extractFaceIndexFromLeaf(leaf) {
    return leaf;
}

/**
 * terrain tile is a part of a 2d array
 * @param {Sampler2D} samplerHeight
 */
const TerrainTile = function (samplerHeight) {
    this.gridPosition = new Vector2();
    this.scale = new Vector2(1, 1);
    this.size = new Vector2();
    this.position = new Vector2();
    this.samplerHeight = samplerHeight;
    this.resolution = new ObservedInteger(1);
    this.material = null;
    this.mesh = ThreeFactory.createMesh();
    this.mesh.scale.set(0.9, 0.9, 0.9); //DEBUG
    /**
     * Terrain mesh is static, it never changes its transform. Updates are wasteful.
     * @type {boolean}
     */
    this.mesh.matrixWorldNeedsUpdate = false;

    this.geometry = null;

    this.enableBVH = true;

    this.boundingBox = new LeafNode(this);

    this.bvh = null;


    this.foliageMeshes = [];

    this.isBuilt = false;
    this.isBuildInProgress = false;
    this.referenceCount = 0;
    this.buildCallbacks = [];

    this.stitching = {
        top: false,
        bottom: false,
        left: false,
        right: false,

        topLeft: false,
        topRight: false,

        bottomLeft: false,
        bottomRight: false
    };

    this.raycaster = new BVHGeometryRaycaster();
    //Binary BVH form doesn't have distinct leaf objects and stores face indices directly, this requires a special face index extractor that treats leaves as indices directly.
    this.raycaster.extractFaceIndexFromLeaf = extractFaceIndexFromLeaf;
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {function} callback
 * @param {function} missCallback
 */
TerrainTile.prototype.raycastVertical = function (x, y, callback, missCallback) {
    return this.raycaster.raycastVertical(x, y, callback, missCallback)
};

/**
 *
 * @param {Vector3} origin
 * @param {Vector3} direction
 * @param {function} callback
 * @param {function} missCallback
 */
TerrainTile.prototype.raycast = function (origin, direction, callback, missCallback) {
    return this.raycaster.raycast(origin, direction, callback, missCallback);
};

TerrainTile.prototype.getVertexNormal = function (index, result) {
    const normals = this.geometry.attributes.normal.array;
    const index3 = index * 3;

    result.set(normals[index3], normals[index3 + 1], normals[index3 + 2]);
};

TerrainTile.prototype.setVertexNormal = function (index, value) {
    const normals = this.geometry.attributes.normal.array;
    const index3 = index * 3;

    normals[index3] = value.x;
    normals[index3 + 1] = value.y;
    normals[index3 + 2] = value.z;
};

/**
 *
 * @param {TerrainTile|undefined} top
 * @param {TerrainTile|undefined} bottom
 * @param {TerrainTile|undefined} left
 * @param {TerrainTile|undefined} right
 * @param {TerrainTile|undefined} topLeft
 * @param {TerrainTile|undefined} topRight
 * @param {TerrainTile|undefined} bottomLeft
 * @param {TerrainTile|undefined} bottomRight
 */
TerrainTile.prototype.stitchNormals2 = function (top, bottom, left, right, topLeft, topRight, bottomLeft, bottomRight) {


    const v0 = new Vector3(),
        v1 = new Vector3(),
        v2 = new Vector3(),
        v3 = new Vector3();

    const tile = this;

    function tileIsBuilt(tile) {
        return tile !== undefined && tile.isBuilt;
    }

    function updateNormals(tile) {
        tile.geometry.attributes.normal.needsUpdate = true;
    }

    /**
     *
     * @param {TerrainTile} top
     * @param {TerrainTile} bottom
     */
    function stitchVertical(top, bottom) {
        //can only stitch if both sides are built
        if (tileIsBuilt(top) && tileIsBuilt(bottom)) {
            let i;

            const thisResolution = bottom.resolution.getValue();

            const otherResolution = top.resolution.getValue();
            const otherOffset = top.size.x * otherResolution * (top.size.y * otherResolution - 1);

            const stitchCount = bottom.size.x * thisResolution - 1;

            //see if we can copy one from the other
            if (top.stitching.bottom) {
                for (i = 1; i < stitchCount; i++) {
                    top.getVertexNormal(otherOffset + i, v0);
                    bottom.setVertexNormal(i, v0);
                }
                updateNormals(bottom);
                bottom.stitching.top = true;
            } else if (bottom.stitching.top) {
                for (i = 1; i < stitchCount; i++) {
                    bottom.getVertexNormal(i, v0);
                    top.setVertexNormal(otherOffset + i, v0);
                }
                updateNormals(top);
                top.stitching.bottom = true;
            } else {
                //neither is stitched
                for (i = 1; i < stitchCount; i++) {
                    bottom.getVertexNormal(i, v0);
                    top.getVertexNormal(otherOffset + i, v1);

                    v0.add(v1).normalize();
                    bottom.setVertexNormal(i, v0);
                    top.setVertexNormal(otherOffset + i, v0);
                }
                updateNormals(top);
                updateNormals(bottom);
                top.stitching.bottom = true;
                bottom.stitching.top = true;
            }

        }
    }

    /**
     *
     * @param {TerrainTile} left
     * @param {TerrainTile} right
     */
    function stitchHorizontal(left, right) {
        if (tileIsBuilt(left) && tileIsBuilt(right)) {
            let i;
            const thisResolution = right.resolution.getValue();

            const otherResolution = left.resolution.getValue();

            const stitchCount = right.size.y * thisResolution - 1;

            const otherOffset = left.size.x * otherResolution - 1;
            const otherMultiplier = left.size.x * otherResolution;
            const thisMultiplier = right.size.x * thisResolution;

            let index0, index1;
            if (left.stitching.right) {

                for (i = 0; i < stitchCount; i++) {
                    index0 = i * thisMultiplier;
                    index1 = otherOffset + i * otherMultiplier;

                    left.getVertexNormal(index1, v0);
                    right.setVertexNormal(index0, v0);
                }
                updateNormals(right);
                right.stitching.left = true;
            } else if (right.stitching.left) {
                for (i = 0; i < stitchCount; i++) {
                    index0 = i * thisMultiplier;
                    index1 = otherOffset + i * otherMultiplier;

                    right.getVertexNormal(index0, v0);
                    left.setVertexNormal(index1, v0);
                }
                updateNormals(left);
                left.stitching.right = true;
            } else {
                //neither is stitched
                for (i = 0; i < stitchCount; i++) {
                    index0 = i * thisMultiplier;
                    index1 = otherOffset + i * otherMultiplier;

                    right.getVertexNormal(index0, v0);
                    left.getVertexNormal(index1, v1);

                    v0.add(v1).normalize();
                    right.setVertexNormal(index0, v0);
                    left.setVertexNormal(index1, v0);
                }
                updateNormals(left);
                updateNormals(right);
                left.stitching.right = true;
                right.stitching.left = true;
            }
        }
    }

    /**
     *
     * @param {TerrainTile} topLeft
     * @param {TerrainTile} topRight
     * @param {TerrainTile} bottomLeft
     * @param {TerrainTile} bottomRight
     */
    function stitchOneCorner(topLeft, topRight, bottomLeft, bottomRight) {
        function topLeftCornerIndex() {
            return (topLeft.size.x * topLeft.resolution.getValue()) * (topLeft.size.y * topLeft.resolution.getValue()) - 1;
        }

        function topRightCornerIndex() {
            return topRight.size.x * topRight.resolution.getValue() * (topRight.size.y * topRight.resolution.getValue() - 1);
        }

        function bottomLeftCornerIndex() {
            return bottomLeft.size.x * bottomLeft.resolution.getValue() - 1;
        }


        if (tileIsBuilt(topLeft) && tileIsBuilt(topRight) && tileIsBuilt(bottomLeft) && tileIsBuilt(bottomRight)) {

            const tlCornerIndex = topLeftCornerIndex();
            const cornerIndex = 0;
            const tCornerIndex = topRightCornerIndex();
            const lCornerIndex = bottomLeftCornerIndex();

            topLeft.getVertexNormal(tlCornerIndex, v0);
            bottomRight.getVertexNormal(cornerIndex, v1);
            topRight.getVertexNormal(tCornerIndex, v2);
            bottomLeft.getVertexNormal(lCornerIndex, v3);

            v0.add(v1).add(v2).add(v3).normalize();
            topLeft.setVertexNormal(tlCornerIndex, v0);
            bottomRight.setVertexNormal(cornerIndex, v0);
            topRight.setVertexNormal(tCornerIndex, v0);
            bottomLeft.setVertexNormal(lCornerIndex, v0);

            updateNormals(topLeft);
            updateNormals(topRight);
            updateNormals(bottomLeft);
            updateNormals(bottomRight);
            topLeft.stitching.bottomRight = true;
            topRight.stitching.bottomLeft = true;
            bottomLeft.stitching.topRight = true;
            bottomRight.stitching.topLeft = true;
        }
    }

    function stitchCorners() {
        //top-left
        stitchOneCorner(topLeft, top, left, tile);
        //top-right
        stitchOneCorner(top, topRight, tile, right);
        //bottom-left
        stitchOneCorner(left, tile, bottomLeft, bottom);
        //bottom-right
        stitchOneCorner(tile, right, bottom, bottomRight);
    }

    function stitchSides() {
        //top
        stitchVertical(top, tile);
        //bottom
        stitchVertical(tile, bottom);
        //left
        stitchHorizontal(left, tile);
        //right
        stitchHorizontal(tile, right);
    }

    stitchCorners();
    stitchSides();
};

TerrainTile.prototype.stitchNormals = function (top, left, topLeft) {
    const v0 = new Vector3(),
        v1 = new Vector3();
    if (top !== null && left !== null && topLeft !== null) {

        const v2 = new Vector3();
        const v3 = new Vector3();
        //fix corner
        const tlCornerIndex = (topLeft.size.x * topLeft.resolution.getValue()) * (topLeft.size.y * topLeft.resolution.getValue()) - 1;
        const cornerIndex = 0;
        const tCornerIndex = top.size.x * top.resolution.getValue() * (top.size.y * top.resolution.getValue() - 1);
        const lCornerIndex = left.size.x * left.resolution.getValue() - 1;

        topLeft.getVertexNormal(tlCornerIndex, v0);
        this.getVertexNormal(cornerIndex, v1);
        top.getVertexNormal(tCornerIndex, v2);
        left.getVertexNormal(lCornerIndex, v3);

        v0.add(v1).add(v2).add(v3).normalize();
        topLeft.setVertexNormal(tlCornerIndex, v0);
        this.setVertexNormal(cornerIndex, v0);
        top.setVertexNormal(tCornerIndex, v0);
        left.setVertexNormal(lCornerIndex, v0);
    }
    let i, l;
    let otherOffset;
    let otherResolution;
    const thisResolution = this.resolution.getValue();
    if (top !== null) {
        otherResolution = top.resolution.getValue();
        otherOffset = top.size.x * otherResolution * (top.size.y * otherResolution - 1);
        for (i = 0, l = this.size.x * thisResolution; i < l; i++) {
            this.getVertexNormal(i, v0);
            top.getVertexNormal(otherOffset + i, v1);

            v0.add(v1).normalize();
            this.setVertexNormal(i, v0);
            top.setVertexNormal(otherOffset + i, v0);
        }
    }
    if (left !== null) {
        otherResolution = left.resolution.getValue();
        otherOffset = left.size.x * otherResolution - 1;
        const otherMultiplier = left.size.x * otherResolution;
        const thisMultiplier = this.size.x * thisResolution;
        for (i = 0, l = this.size.y * thisResolution; i < l; i++) {

            const index0 = i * thisMultiplier;
            const index1 = otherOffset + i * otherMultiplier;

            this.getVertexNormal(index0, v0);
            left.getVertexNormal(index1, v1);

            v0.add(v1).normalize();
            this.setVertexNormal(index0, v0);
            left.setVertexNormal(index1, v0);
        }
    }
};

TerrainTile.prototype.computeBoundingBox = function () {
    const geometry = this.geometry;
    //check for bvh
    const bvh = this.bvh;
    if (bvh !== null) {
        geometry.boundingBox = new ThreeBox3(new ThreeVector3(bvh.x0, bvh.y0, bvh.z0), new ThreeVector3(bvh.x1, bvh.y1, bvh.z1));

        const dX = bvh.x1 - bvh.x0;
        const dY = bvh.y1 - bvh.y0;
        const dZ = bvh.z1 - bvh.z0;

        const radius = Math.sqrt(dX * dX + dY * dY + dZ * dZ) / 2;

        const center = new ThreeVector3(bvh.x0 + dX / 2, bvh.y0 + dY / 2, bvh.z0 + dZ / 2);

        geometry.boundingSphere = new ThreeSphere(center, radius);
    }
    //pull bounding box from geometry
    let bb = geometry.boundingBox;
    if (bb === null) {
        geometry.computeBoundingBox();
        bb = geometry.boundingBox;
    }
    this.boundingBox.setBounds(bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z);
};

TerrainTile.prototype.generateBufferedGeometryBVH = function () {
    const geometry = this.geometry;
    // console.profile('build bvh');
    this.bvh = BVHFromBufferGeometry.buildUnsortedBinaryBVH(geometry);
    // console.profileEnd('build bvh');
};

TerrainTile.prototype.unload = function () {
    this.isBuilt = false;

    this.geometry = null;
    this.bvh = null;

    const stitching = this.stitching;

    stitching.top = false;
    stitching.bottom = false;

    stitching.left = false;
    stitching.right = false;

    stitching.topLeft = false;
    stitching.topRight = false;

    stitching.bottomLeft = false;
    stitching.bottomRight = false;
};

TerrainTile.prototype.createInitialBounds = function (heightRange) {
    const offset = this.position.clone().multiply(this.scale);

    const size = this.size.clone().multiply(this.scale);

    const max = offset.clone().add(size);

    this.boundingBox.setBounds(offset.x, -heightRange / 2, offset.y, max.x, heightRange / 2, max.y);
};

TerrainTile.prototype.build = function (tileData) {
    this.isBuilt = true;
    // console.groupCollapsed('Building tile');
    // console.time('total');
    const self = this;

    const tileDataGeometry = tileData.geometry;

    const g = new ThreeBufferGeometry();
    g.setIndex(new ThreeBufferAttribute(tileDataGeometry.indices, 1));
    g.addAttribute('position', new ThreeBufferAttribute(tileDataGeometry.vertices, 3));
    g.addAttribute('normal', new ThreeBufferAttribute(tileDataGeometry.normals, 3));
    g.addAttribute('uv', new ThreeBufferAttribute(tileDataGeometry.uvs, 2));
    //second UV set is needed for lightmap, this is already present in TerrainShader
    // g.addAttribute('uv2', new THREE.BufferAttribute(tileDataGeometry.uvs, 2));

    this.geometry = g;

    if (this.enableBVH) {
        // console.time('bvh');
        // this.generateBufferedGeometryBVH();
        const bvh = this.bvh = new IndexedBinaryBVH();
        for (let p in tileData.bvh) {
            if (tileData.bvh.hasOwnProperty(p)) {
                bvh[p] = tileData.bvh[p];
            }
        }
        // console.timeEnd('bvh');
    }


    //set bounding box
    // console.time('bb');
    this.computeBoundingBox();
    // console.timeEnd('bb');

    const mesh = this.mesh;

    mesh.geometry = g;
    mesh.material = self.material;

    mesh.receiveShadow = true;
    mesh.castShadow = false;

    // console.timeEnd('total');
    // console.groupEnd();

    this.raycaster.bvh = this.bvh;
    this.raycaster.geometry = g;
    this.raycaster.position = this.position;
    this.raycaster.scale = this.scale;
    this.raycaster.resolution = this.resolution.getValue();
    this.raycaster.size = this.size;

    return mesh;
};

export default TerrainTile;
