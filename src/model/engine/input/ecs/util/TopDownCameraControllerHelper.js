/**
 * Created by Alex on 22/08/2015.
 */
import Transform from '../../../ecs/components/Transform';
import Renderable from '../../../ecs/components/Renderable';
import Vector3 from '../../../../core/geom/Vector3';
import EntityBuilder from '../../../ecs/EntityBuilder';
import { Group as ThreeGroup, Matrix4 as ThreeMatrix4, Mesh as ThreeMesh, MeshLambertMaterial } from 'three';


const tMarkerFromMaterial = new MeshLambertMaterial({ color: 0xFF0000 });

const tMarkerToMaterial = new MeshLambertMaterial({ color: 0xffff00 });

const lookAt = (function () {
    // just in case you need that function also
    function CreateFromAxisAngle(axis, angle, result) {
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        result.set(axis.x * s, axis.y * s, axis.z * s, Math.cos(halfAngle));
    }

    const forwardVector = new Vector3();
    const __forwardVector = new Vector3(0, 0, 1);
    const __upVector = new Vector3(0, 1, 0);
    const rotAxis = new Vector3();

    function lookAt(sourcePoint, destPoint, result) {
        forwardVector.copy(destPoint).sub(sourcePoint).normalize();
        const dot = __forwardVector.dot(forwardVector);
        if (Math.abs(dot - (-1.0)) < 0.000001) {
            return result.set(__upVector.x, __upVector.y, __upVector.z, 3.1415926535897932);
        }
        if (Math.abs(dot - (1.0)) < 0.000001) {
            return result.set(0, 0, 0, 1);
        }

        const rotAngle = Math.acos(dot);
        rotAxis.copy(__forwardVector);
        rotAxis.cross(forwardVector);
        rotAxis.normalize();
        return CreateFromAxisAngle(rotAxis, rotAngle, result);
    }

    return lookAt;
})();
const TopDownCameraControllerHelper = function (targetController, targetTransform, size) {
    const tMarkerFromGeometry = new CylinderGeometry(0, size * 0.5, size, 10, 1);
    const tMarkerToGeometry = new SphereGeometry(size / 2, 32, 32);

    const matrix4 = new ThreeMatrix4();
    matrix4.makeRotationX(-Math.PI / 2);
    tMarkerFromGeometry.applyMatrix(matrix4);

    const tMarkerFrom = new ThreeMesh(tMarkerFromGeometry, tMarkerFromMaterial);
    tMarkerFrom.castShadow = true;
    const tMarkerTo = new ThreeMesh(tMarkerToGeometry, tMarkerToMaterial);
    tMarkerTo.castShadow = true;

    const group = new ThreeGroup();
    group.add(tMarkerFrom);
    group.add(tMarkerTo);


    const builder = new EntityBuilder();
    const transform = new Transform();
    builder.add(new Renderable(group))
        .add(transform);

    function update() {
        const p = targetTransform.position;
        transform.position.copy(p);
        tMarkerTo.position.copy(targetController.target);
        tMarkerTo.position.sub(p);

        tMarkerFrom.quaternion.copy(targetTransform.rotation);
    }

    targetController.target.onChanged.add(update);
    targetTransform.position.onChanged.add(update);
    return builder;
};

export default TopDownCameraControllerHelper;