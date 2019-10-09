/**
 * Created by Alex on 02/04/2014.
 */
import Transform from './ecs/components/Transform';
import { SoundEmitter } from './../sound/ecs/SoundEmitter';
import Timer from './ecs/components/Timer';
import EntityBuilder from './ecs/EntityBuilder';

import { LatheGeometry as ThreeLatheGeometry, Matrix4 as ThreeMatrix4, Vector3 as ThreeVector3 } from 'three';
import Vector3 from "../core/geom/Vector3.js";
import { SoundEmitterChannels } from "../sound/ecs/SoundEmitterSystem.js";

function CapsuleGeometry(radius, length, cutSegments, sphereSegments) {
    const points = [];
    let i, angle;
    //top cap
    for (i = 0; i <= sphereSegments; i++) {
        angle = Math.PI / 2 - (i / sphereSegments) * Math.PI / 2;
        points.push(new ThreeVector3(radius * Math.cos(angle), 0, radius * Math.sin(angle) + length / 2));
    }
    //bottom cap
    for (i = 0; i <= sphereSegments; i++) {
        angle = -(i / sphereSegments) * Math.PI / 2;
        points.push(new ThreeVector3(radius * Math.cos(angle), 0, -(length / 2) + radius * Math.sin(angle)));
    }
    const lathe = new ThreeLatheGeometry(points, cutSegments);
    //transform
    const m = new ThreeMatrix4();
    m.makeRotationX(Math.PI / 2);
    lathe.applyMatrix(m);
    return lathe;
}

function scaleGeometryToRadius(geometry, radius, result) {
    const boundingSphere = geometry.boundingSphere;
    const scale = radius / boundingSphere.radius;
    result.set(scale, scale, scale);
}

function wrapMeshInGroupAndCenterOnOrigin(mesh) {
    //center mesh on origin
    const bbox = mesh.geometry.boundingBox;
    const offset = bbox.max.clone().add(bbox.min).multiplyScalar(-0.5).multiply(mesh.scale);
    const group = new ThreeGroup();
    mesh.position.copy(offset);
    group.add(mesh);
    return group;
}

function getMeshBBoxSize(mesh) {
    const boundingBox = mesh.geometry.boundingBox;
    return boundingBox.max.clone().sub(boundingBox.min).multiply(mesh.scale);
}

/**
 *
 * @param {Vector3} [position]
 * @param {number} [timeout]
 * @param {String} url
 * @param {boolean} [positioned]
 * @param {String|SoundEmitterChannels} [channel]
 * @param {number} [volume]
 * @returns {EntityBuilder}
 */
function createSound(
    {
        position = Vector3.zero,
        timeout = 60,
        url,
        positioned = true,
        channel = SoundEmitterChannels.Effects,
        volume = 1
    }
) {

    const builder = new EntityBuilder();

    function suicide() {
        builder.destroy(); //kill projectile
    }

    const soundEmitter = SoundEmitter.fromJSON({
        tracks: [{
            url: url,
            startWhenReady: true
        }],
        isPositioned: positioned,
        volume: volume,
        loop: false,
        channel
    });


    const soundTrack = soundEmitter.tracks.last();
    soundTrack.on.ended.add(suicide);

    builder.add(new Timer({ timeout: timeout, actions: [suicide] })) //prevent projectiles from flying forever
        .add(Transform.fromJSON({ position: position }))
        .add(soundEmitter);
    return builder;
}

/**
 *
 * @param timeout
 * @param action
 * @returns {EntityBuilder}
 */
export function createTimer({ timeout, action }) {
    const builder = new EntityBuilder();

    function suicide() {
        builder.destroy();
    }

    builder.add(new Timer({
        timeout,
        actions: [
            action,
            suicide
        ]
    }));

    return builder;
}

export { createSound };
