/**
 * Created by Alex on 14/06/2017.
 */


import { System } from '../../../engine/ecs/System';
import Transform from '../../../engine/ecs/components/Transform';
import Vector3 from '../../../core/geom/Vector3';
import { clamp } from '../../../core/math/MathUtils';

import Trail2D from './Trail2D';
import TrailMaterial from './CodeflowTrailMaterial';
import { BufferAttribute, ClampToEdgeWrapping, LinearFilter } from 'three';
import Ribbon from '../../geometry/Ribbon';

import { LeafNode } from '../../../core/bvh2/LeafNode';
import ThreeFactory from '../../three/ThreeFactory';
import { GraphicsEngine } from "../../GraphicsEngine.js";
import { ReferenceManager } from "../../../ReferenceManager.js";
import { AssetManager } from "../../../engine/asset/AssetManager.js";

/**
 *
 * @param {Trail2D} component
 * @param {Vector2} size
 */
function setViewportSize(component, size) {
    const material = component.mesh.material;
    material.uniforms.viewport.value.set(size.x, size.y);
}

/**
 *
 * @param {number} numSegments
 * @returns {Ribbon}
 */
function createRibbon(numSegments) {

    const ribbon = new Ribbon(numSegments, 1);
    const geometry = ribbon.geometry;

    /*
     attribute vec3 last, current, next;
     attribute vec3 barycentric;
     attribute float off;
     attribute float uvOffset;
     */

    const position = geometry.attributes.position;
    const vertexCount = position.count;


    const last = new Float32Array(vertexCount * 3);
    const next = new Float32Array(vertexCount * 3);
    const off = new Int8Array(vertexCount);
    const uvOffset = new Float32Array(vertexCount);
    const creationTime = new Float32Array(vertexCount);

    const aLast = new BufferAttribute(last, 3);
    const aNext = new BufferAttribute(next, 3);
    const aOff = new BufferAttribute(off, 1);
    const aUvOffset = new BufferAttribute(uvOffset, 1);
    const aCreationTime = new BufferAttribute(creationTime, 1);

    geometry.addAttribute("last", aLast);
    geometry.addAttribute("next", aNext);
    geometry.addAttribute("off", aOff);
    geometry.addAttribute("uvOffset", aUvOffset);
    geometry.addAttribute("creationTime", aCreationTime);


    aLast.needsUpdate = true;
    aNext.needsUpdate = true;
    aOff.needsUpdate = true;
    aUvOffset.needsUpdate = true;
    aCreationTime.needsUpdate = true;
    aCreationTime.dynamic = true;


    //set offsets
    aOff.dynamic = false;

    //offset attribute
    geometry.addAttribute("off", aOff);

    ribbon.traverseEdges(function (a, b, index, maxIndex) {
        off[a] = 1;
        off[b] = -1;
    });

    return ribbon;
}

/**
 *
 * @param {string} url
 * @param {Material} material
 * @param {ReferenceManager<string,Promise.<THREE.Texture>>} textures
 */
function initializeTexture(url, material, textures) {
    if (url === null) {
        material.defines.USE_TEXTURE = false;
    } else {
        material.defines.USE_TEXTURE = true;

        textures.acquire(url).then(function (texture) {

            material.uniforms.uTexture.value = texture;

        });
    }

    material.needsUpdate = true;
}

/**
 *
 * @param {BufferAttribute} source
 * @param {int} sourceIndex
 * @param {BufferAttribute} target
 * @param {int} targetIndex
 * @param {int} count
 */
function copyAttributeValue(source, sourceIndex, target, targetIndex, count) {
    const targetArray = target.array;

    const sourceArray = source.array;

    for (let i = 0; i < count; i++) {
        targetArray[targetIndex + i] = sourceArray[sourceIndex + i];
    }
}

/**
 *
 * @param {BufferAttribute} source
 * @param {int} sourceIndex
 * @param {BufferAttribute} target
 * @param {int} targetIndex
 */
function copyAttributeV3(source, sourceIndex, target, targetIndex) {
    copyAttributeValue(source, sourceIndex * 3, target, targetIndex * 3, 3);
}

/**
 *
 * @param {BufferAttribute} first
 * @param {int} firstIndex
 * @param {BufferAttribute} second
 * @param {int} secondIndex
 * @param {int} count
 * @returns {boolean}
 */
function equalAttributeValue(first, firstIndex, second, secondIndex, count) {
    const firstArray = first.array;

    const secondArray = second.array;

    for (let i = 0; i < count; i++) {
        const vFirst = firstArray[firstIndex + i];
        const vSecond = secondArray[secondIndex + i];
        if (vFirst !== vSecond) {
            return false;
        }
    }

    return true;
}

/**
 *
 * @param {BufferAttribute} first
 * @param {int} firstIndex
 * @param {BufferAttribute} second
 * @param {int} secondIndex
 * @returns {boolean}
 */
function equalAttributeV3(first, firstIndex, second, secondIndex) {
    return equalAttributeValue(first, firstIndex * 3, second, secondIndex * 3, 3);
}

/**
 *
 * @param {Ribbon} ribbon
 */
function rotateRibbon(ribbon) {
    ribbon.rotate();

    const newHead = ribbon.head();
    const neck = newHead.previous;

    const geometry = ribbon.geometry;

    const attributes = geometry.attributes;

    const next = attributes.next;
    const prev = attributes.last;
    const position = attributes.position;


    //set head segment
    if (equalAttributeV3(position, neck.getA(), position, neck.getC())) {
        //neck had 0 length, clone "prev" from it
        copyAttributeV3(prev, newHead.getA(), prev, newHead.getC());
        copyAttributeV3(prev, newHead.getB(), prev, newHead.getD());
    } else {
        copyAttributeV3(position, newHead.getA(), prev, newHead.getC());
        copyAttributeV3(position, newHead.getB(), prev, newHead.getD());

    }


    next.needsUpdate = true;
    prev.needsUpdate = true;
}

/**
 *
 * @param {Ribbon} ribbon
 * @param {Vector3} v3
 */
function updateTipPosition(ribbon, v3) {
    const geometry = ribbon.geometry;

    const attributes = geometry.attributes;
    const next = attributes.next;
    const prev = attributes.last;


    const head = ribbon.head();

    head.setVertexC(v3);
    head.setVertexD(v3);

    const vTemp = new Vector3();
    const vPreviousPosition = new Vector3();
    head.getVertexA(vPreviousPosition);

    //special case when new head is at the same place as the old one
    if (v3.equals(vPreviousPosition)) {
        copyAttributeV3(prev, head.getA(), prev, head.getC());
        copyAttributeV3(prev, head.getB(), prev, head.getD());

        copyAttributeV3(next, head.getA(), next, head.getC());
        copyAttributeV3(next, head.getB(), next, head.getD());
    } else {
        //compute next offset from position
        vTemp.copy(v3).sub(vPreviousPosition).add(v3);

        //update head tip
        next.setXYZ(head.getC(), vTemp.x, vTemp.y, vTemp.z);
        next.setXYZ(head.getD(), vTemp.x, vTemp.y, vTemp.z);

        //update neck
        next.setXYZ(head.getA(), v3.x, v3.y, v3.z);
        next.setXYZ(head.getB(), v3.x, v3.y, v3.z);
    }

    next.needsUpdate = true;
    prev.needsUpdate = true;
}

class Trail2DSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     * @param {AssetManager} assetManager
     * @constructor
     */
    constructor(graphics, assetManager) {
        super();

        this.componentClass = Trail2D;
        this.dependencies = [Transform];

        if (!(graphics instanceof GraphicsEngine)) {
            throw new Error("'graphics' must be of type GraphicsEngine");
        }

        if (!(assetManager instanceof AssetManager)) {
            throw new Error("'assetManager' must be of type AssetManager");
        }

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphics = graphics;

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = assetManager;

        function constructTexture(url) {
            const assetPromise = assetManager.promise(url, "texture");

            const texturePromise = assetPromise
                .then(function (asset) {

                    const texture = asset.create();

                    texture.wrapS = ClampToEdgeWrapping;
                    texture.wrapT = ClampToEdgeWrapping;

                    texture.magFilter = LinearFilter;
                    texture.minFilter = LinearFilter;

                    return texture;
                });

            return texturePromise;
        }

        function destructTexture(url, texturePromise) {
            texturePromise.then(function (t) {
                //release used resourced
                t.dispose();
            });
        }

        /**
         *
         * @type {ReferenceManager<string,Promise.<THREE.Texture>>}
         */
        this.textures = new ReferenceManager(constructTexture, destructTexture);


        /**
         *
         * @type {RenderLayer|null}
         */
        this.renderLayer = null;

        /**
         *
         * @type {BinaryNode}
         */
        this.bvh = null;

        //
        this.dying = [];

        const self = this;
        //watch viewport size changes
        const viewportSize = this.graphics.viewport.size;
        viewportSize.onChanged.add(function () {
            const em = self.entityManager;
            if (em !== null && em !== undefined) {
                em.traverseComponents(Trail2D, function (component) {
                    setViewportSize(component, viewportSize);
                });
            }
        });
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        this.renderLayer = this.graphics.layers.create('trail-2d-system');

        this.renderLayer.extractRenderable = function (trail) {
            return trail.mesh;
        };

        this.bvh = this.renderLayer.bvh;

        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphics.layers.remove(this.renderLayer);

        readyCallback();
    }

    /**
     *
     * @param {Transform} transform
     * @param {Trail2D} trail
     * @param {number} entityId
     */
    link(trail, transform, entityId) {
        const segmentsPerSecond = 60;
        const maxSegments = 1000;
        //instantiation
        //make a mesh
        const numSegments = Math.ceil(clamp(trail.maxAge * segmentsPerSecond, 1, maxSegments));
        const ribbon = createRibbon(numSegments);
        const geometry = ribbon.geometry;

        //TODO cache materials

        const material = new TrailMaterial();
        initializeTexture(trail.textureURL, material, this.textures);

        material.uniforms.color.value.copy(trail.color);
        material.uniforms.width.value = trail.width;
        material.uniforms.maxAge.value = trail.maxAge;

        material.needsUpdate = true;

        const mesh = ThreeFactory.createMesh(geometry, material);

        trail.time = 0;
        trail.trailingIndex = 0;
        trail.ribbon = ribbon;
        trail.mesh = mesh;
        trail.timeSinceLastUpdate = 0;

        const leafNode = new LeafNode();

        trail.bvhLeaf = leafNode;

        leafNode.object = trail;
        leafNode.setInfiniteBounds();

        setViewportSize(trail, this.graphics.viewport.size);

        //set BVH bounds to a single point at transform's position to ensure better BVH placement
        // trail.bvhLeaf.setBounds(transform.position.x, transform.position.y, transform.position.z, transform.position.x, transform.position.y, transform.position.z);
        trail.bvhLeaf.setInfiniteBounds();

        const position = trail.offset.clone().add(transform.position);

        trail.ribbon.moveToPoint(position);
        const attributes = trail.ribbon.geometry.attributes;
        const last = attributes.last;
        const next = attributes.next;
        const creationTime = attributes.creationTime;
        trail.ribbon.traverseEdges(function (a, b) {
            next.setXYZ(a, position.x, position.y, position.z);
            next.setXYZ(b, position.x, position.y, position.z);

            last.setXYZ(a, position.x, position.y, position.z);
            last.setXYZ(b, position.x, position.y, position.z);

            creationTime.array[a] = -trail.maxAge;
            creationTime.array[b] = -trail.maxAge;
        });

        this.bvh.insertNode(trail.bvhLeaf);
    }

    unlink(component, transform, entity) {
        this.dying.push({
            component,
            age: 0
        });
    }

    update(timeDelta) {

        const vTemp = new Vector3();

        const em = this.entityManager;

        const dataset = em.dataset;

        /**
         *
         * @param {Trail2D} trail
         * @param {Transform} transform
         */
        function visitTrailEntity(trail, transform) {
            const ribbon = trail.ribbon;

            const newPosition = transform.position.clone().add(trail.offset);

            trail.timeSinceLastUpdate += timeDelta;
            trail.time += timeDelta;

            const refitTimeDelta = trail.maxAge / trail.ribbon.length;


            if (trail.timeSinceLastUpdate < refitTimeDelta) {
                //refitting
            } else {
                ribbon.head().getVertexA(vTemp);
                if (!vTemp.equals(newPosition)) {
                    //make sure that this is a new position before rotating new segment
                    trail.timeSinceLastUpdate -= refitTimeDelta;
                    //rotating segment
                    rotateRibbon(ribbon);
                }
            }

            const head = ribbon.head();

            updateTipPosition(ribbon, newPosition);

            const attributes = ribbon.geometry.attributes;
            /**
             *
             * @type {THREE.BufferAttribute}
             */
            const creationTime = attributes.creationTime;


            creationTime.array[head.getC()] = trail.time;
            creationTime.array[head.getD()] = trail.time;


            creationTime.needsUpdate = true;

            //update simulation time of the shader
            trail.mesh.material.uniforms.time.value = trail.time;

        }

        if (dataset !== null) {
            dataset.traverseEntities([Trail2D, Transform], visitTrailEntity);
        }

        updateDyingSet(this.dying, timeDelta);
    }
}


/**
 *
 * @param {Array} dying
 * @param {number} timeDelta
 */
function updateDyingSet(dying, timeDelta) {
    for (let i = dying.length - 1; i >= 0; i--) {
        const entry = dying[i];
        const component = entry.component;

        entry.age += timeDelta;

        //update simulation time
        component.mesh.material.uniforms.time.value += timeDelta;

        if (entry.age > component.maxAge) {
            component.bvhLeaf.disconnect();
            dying.splice(i, 1);
        }
    }
}

export default Trail2DSystem;
