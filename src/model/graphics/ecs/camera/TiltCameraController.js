/**
 * Created by Alex on 30/06/2015.
 */
import { Object3D, Vector3 as ThreeVector3 } from 'three';

import Vector3 from "../../../core/geom/Vector3";
import Vector2 from '../../../core/geom/Vector2';

const CC = function () {
    this.target = new Vector3();
    this.rotationAxis = new Vector3(0, 1, 0);
    this.rotationAngle = (Math.PI / 180) * 0;
    //angle between rotation axis and vector from target to position
    this.tiltAngle = (Math.PI / 180) * 10;

    this.distance = 100;
    this.position = new Vector3();
    this.rotation = new Vector3();
};

CC.prototype.rotate = function (deltaAngle) {
    this.tiltAngle += deltaAngle;
};

CC.prototype.pan = function (deltaX, deltaY, cameraRotation) {
    //vector pointing in the direction of travel
    const vector = new ThreeVector3(deltaX, 0, deltaY);
    //var rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(cameraRotation);
    //vector.applyMatrix4(rotationMatrix);
    ////add to delta vector
    //vector.y = 0;
    this.target.add(vector);
};

const object = new Object3D();

function eulerJSON(o) {
    return { x: o.x, y: o.y, z: o.z };
}

CC.prototype.updatePositionAndRotation = function (transform) {
    const distance = this.distance;
    const target = this.target;
    const rotationAngle = this.rotationAngle;
    let rotationAxis = this.rotationAxis;
    const tiltAngle = this.tiltAngle;

    //position
    const dTilt = new Vector2();
    dTilt.x = Math.sin(tiltAngle) * distance;
    dTilt.y = Math.cos(tiltAngle) * distance;

    const position = new Vector3();
    position.x = Math.sin(rotationAngle) * dTilt.x;
    position.z = Math.cos(rotationAngle) * dTilt.x;
    position.y = dTilt.y;

    position.add(target);
    //finally look at the target
    object.position.copy(position);
    object.lookAt(target);
    //console.log(position.toJSON(), target.toJSON());

    //
    //transform.position.copy(position);
    //transform.rotation.setFromEuler(object.rotation);
};
export default CC;