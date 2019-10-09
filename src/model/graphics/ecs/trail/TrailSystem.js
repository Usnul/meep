/**
 * Created by Alex Goldring on 21.02.2015.
 */


import { System } from '../../../engine/ecs/System';
import Transform from '../../../engine/ecs/components/Transform';
import Vector3 from '../../../core/geom/Vector3';

import Trail from './Trail';
import TrailMaterial from './TrailMaterial';
import { ClampToEdgeWrapping, NearestFilter, TextureLoader } from 'three';
import Ribbon from '../../geometry/Ribbon';

import { LeafNode } from '../../../core/bvh2/LeafNode';
import ThreeFactory from '../../three/ThreeFactory';

class TrailSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     * @constructor
     */
    constructor(graphics) {
        super();

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphics = graphics;

        this.componentClass = Trail;
        this.dependencies = [Transform];


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
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        this.renderLayer = this.graphics.layers.create('trail-system');

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

    link(trail, transform, entityId) {
        //instantiation
        //make a mesh
        const numSegments = 100;
        const ribbon = new Ribbon(numSegments, trail.startWidth);
        const geometry = ribbon.geometry;
        //TODO cache materials
        const texture = (new TextureLoader()).load(trail.textureURL);

        texture.wrapS = ClampToEdgeWrapping;
        texture.wrapT = ClampToEdgeWrapping;

        texture.magFilter = NearestFilter;
        texture.minFilter = NearestFilter;

        let material = new TrailMaterial();
        material.uniforms.texture.value = texture;

        // material = new THREE.MeshBasicMaterial({map: texture});
        // material = new THREE.MeshBasicMaterial({wireframe: true, color: 0xFF0000});

        material.needsUpdate = true;

        const mesh = ThreeFactory.createMesh(geometry, material);

        trail.trailingIndex = 0;
        trail.ribbon = ribbon;
        trail.mesh = mesh;
        trail.timeSinceLastUpdate = 0;


        trail.bvhLeaf = new LeafNode();
        trail.bvhLeaf.object = trail;
        trail.bvhLeaf.setInfiniteBounds();

        //set BVH bounds to a single point at transform's position to ensure better BVH placement
        // trail.bvhLeaf.setBounds(transform.position.x, transform.position.y, transform.position.z, transform.position.x, transform.position.y, transform.position.z);
        trail.bvhLeaf.setInfiniteBounds();

        const position = trail.offset.clone().add(transform.position);

        trail.ribbon.moveToPoint(position);

        this.bvh.insertNode(trail.bvhLeaf);
    }

    unlink(trail, transform, entity) {
        trail.bvhLeaf.disconnect();
    }

    update(timeDelta) {
        const em = this.entityManager;
        em.traverseEntities([Trail, Transform], function (trail, transform) {
            const ribbon = trail.ribbon;
            let newHead;
            let oldHead = ribbon.head();

            trail.timeSinceLastUpdate += timeDelta;
            if (trail.timeSinceLastUpdate < timeDeltaForRefitting) {
                //refitting
                newHead = oldHead;
            } else {
                trail.timeSinceLastUpdate = 0;
                //rotating segment
                newHead = ribbon.rotate().head();

                applyOpacity(ribbon, trail.startOpacity, trail.endOpacity);

            }

            ribbon.positionHead(transform.position.clone().add(trail.offset), new Vector3(0, 0, 1), trail.startWidth);
            //
        });
    }
}


const timeDeltaForRefitting = 0.015;


function applyOpacity(ribbon, startValue, endValue) {
    const opacityAttribute = ribbon.geometry.attributes.opacity;
    const opacityArray = opacityAttribute.array;
    ribbon.traverseLerpEdges(startValue, endValue, function (a, b, value) {
        opacityArray[a] = value;
        opacityArray[b] = value;
    });
    opacityAttribute.needsUpdate = true;
}

export default TrailSystem;