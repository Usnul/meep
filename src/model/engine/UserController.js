/**
 * Created by Alex on 29/10/2014.
 */
import Vector3 from "../core/geom/Vector3";
import Transform from './ecs/components/Transform';
import Hammer from 'Hammer';
import { Euler as ThreeEuler, Vector2 as ThreeVector2, Vector3 as ThreeVector3 } from 'three';

const keyboardRotationSpeed = 1.2;

// pass in distance in world space to move left
function panLeft(distance, object, result) {

    const panOffset = new Vector3();
    const te = object.matrix.elements;
    // get X column of matrix
    panOffset.set(te[0], te[1], te[2]);
    panOffset.multiplyScalar(-distance);

    result.add(panOffset);

}

// pass in distance in world space to move up
function panUp(distance, object, result) {

    const panOffset = new Vector3();
    const te = object.matrix.elements;
    // get Y column of matrix
    panOffset.set(te[4], te[5], te[6]);
    panOffset.multiplyScalar(distance);

    result.add(panOffset);
}

// main entry point; pass in Vector2 of change desired in pixel space,
// right and down are positive
function pan(delta, object, element, targetDistance, fov, result) {
    // half of the fov is center to top of screen
    targetDistance *= Math.tan((fov / 2) * Math.PI / 180.0);
    // we actually don't use screenWidth, since perspective camera is fixed to screen height
    panLeft(2 * delta.x * targetDistance / element.clientHeight, object, result);
    panUp(2 * delta.y * targetDistance / element.clientHeight, object, result);
}

const Controller = function (engine) {
    const target = new Vector3();
    let cameraDistance;
    const cameraMinDistance = 0.1;
    const cameraMaxDistance = 100;
    let cameraTransform;
    let cameraPosition;
    let cameraDistanceDelta = 0;
    let camera;
    const controller = {
        forward: false,
        back: false,
        left: false,
        right: false,
        rotateLeft: false,
        rotateRight: false
    };
    const io = engine.inputEngine;
    const domElement = engine.graphics.domElement;

    window.addEventListener("mousewheel", function (event) {
//                console.log(event);
        const wheelDelta = event.wheelDelta;
        //unit is about 120
        const normalized = wheelDelta / 100;
        if (cameraPosition !== void 0) {
            cameraDistanceDelta -= normalized;
        }
    });
    //deltas to operate on
    const translationDelta = new ThreeVector2();
    let rotationDelta = 0;

    function translateCamera2(deltaX, deltaY) {
        const worldDisplacement = new ThreeVector3();
        pan(new ThreeVector2(-deltaX, -deltaY), camera, domElement, 200, camera.fov, worldDisplacement);
        //
        cameraPosition.add(worldDisplacement);
    }

    function translateCamera(deltaX, deltaY) {
        if (cameraPositionSwap !== void 0) {
            const transform = cameraTransform;
            //obtain facing direction
            const euler = new ThreeEuler();
            euler.setFromQuaternion(transform.rotation);
            //vector pointing in the direction of travel
            const vector = new ThreeVector3(deltaX, 0, deltaY);
            const rotationMatrix = new ThreeMatrix4().makeRotationFromQuaternion(transform.rotation);
            vector.applyMatrix4(rotationMatrix);
            //add to delta vector
            vector.y = 0;
            cameraPositionSwap.add(vector);
            target.x += vector.x;
            target.z += vector.z;
        }
    }

    function dollyCamera(distance) {
        if (Number.isNaN(distance)) {
            distance = 0;
        } else if (distance < cameraMinDistance) {
            distance = cameraMinDistance;
        } else if (distance > cameraMaxDistance) {
            distance = cameraMaxDistance;
        }
        const v = target.clone().sub(cameraPositionSwap);
        v.normalize().multiplyScalar(cameraDistance - distance);
        cameraPositionSwap.add(v);
        cameraDistance = distance;
    }

    function rotateCameraY(delta) {
        if (delta === 0) {
            return;
        }
        if (cameraTransform !== void 0) {
            const cameraRotation = cameraTransform.rotation;
            const euler = new ThreeEuler();
            euler.setFromQuaternion(cameraRotation, "YXZ");
            euler.y += delta;
            //change camera position
            let planarDistance = Math.abs(cameraDistance * Math.cos(euler.x));
            let verticalDistance = cameraDistance * Math.sin(euler.x);
            cameraPositionSwap.sub(target).applyAxisAngle(new ThreeVector3(0, 1, 0), delta).add(target);
            //cameraPosition.x = target.x+Math.sin(delta)*planarDistance;
            //cameraPosition.z = target.z+Math.cos(delta)*planarDistance;
            cameraRotation.setFromEuler(euler);
        }
    }

    const mc = new Hammer(domElement);

    mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));

    mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
    mc.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(mc.get('pan'));
    mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan'), mc.get('rotate')]);

    mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
    mc.add(new Hammer.Tap());

    mc.on("panstart", onPanStart);
    mc.on("panmove", onPanMove);
    mc.on("rotatestart rotatemove", onRotate);
    mc.on("pinchstart pinchmove", onPinch);
    //mc.on("swipe", onSwipe);
    //mc.on("tap", onTap);
    //mc.on("doubletap", onDoubleTap);
    let initAngle = 0;

    function onRotate(ev) {
        if (ev.type == 'rotatestart') {
            initAngle = 0;
        }

        const delta = ev.rotation - initAngle;
        initAngle = ev.rotation;
        rotationDelta += delta;
    }

    let initScale = 1;

    function onPinch(evt) {
        if (evt.type == 'pinchstart') {
            initScale = cameraPosition.y;
        }
        const delta = evt.scale - initScale;
        initScale = evt.scale;
        cameraDistanceDelta -= cameraDistance * delta;
    }

    const panDelta = new ThreeVector2();

    function onPanStart(evt) {
        panDelta.set(0, 0);
    }

    function onPanMove(evt) {
        const _x = panDelta.x;
        const _y = panDelta.y;

        const deltaX = evt.deltaX;
        const deltaY = evt.deltaY;
        //change
        const cx = deltaX - _x;
        const cy = deltaY - _y;
        panDelta.set(deltaX, deltaY);
        translationDelta.x -= cx / 10;
        translationDelta.y -= cy / 10;
    }

    const cameraPositionSwap = new Vector3();

    function processKeyboardControls() {
        let x = 0;
        let y = 0;
        let rotation = 0;
        if (controller.forward) {
            y--;
        }
        if (controller.back) {
            y++;
        }
        if (controller.left) {
            x--;
        }
        if (controller.right) {
            x++;
        }
        //
        translationDelta.x += x;
        translationDelta.y += y;
        if (controller.rotateLeft) {
            rotation++;
        }
        if (controller.rotateRight) {
            rotation--;
        }
        rotationDelta += rotation * keyboardRotationSpeed;
    }

    function animate() {
        processKeyboardControls();
        if (cameraPosition !== void 0) {
            cameraPositionSwap.copy(cameraPosition);
        }

        if (rotationDelta !== 0) {
            rotateCameraY(rotationDelta * (Math.PI * 0.01));
            rotationDelta = 0;
        }
        if (translationDelta.x !== 0 || translationDelta.y !== 0) {
            translateCamera(translationDelta.x, translationDelta.y);
            translationDelta.set(0, 0);
        }
        if (cameraDistanceDelta !== 0) {
            dollyCamera(cameraDistance + cameraDistanceDelta);
            cameraDistanceDelta = 0;
        }
        //
        if (cameraPosition !== void 0 && !cameraPositionSwap.equals(cameraPosition)) {
            cameraPosition.copy(cameraPositionSwap);
        }
        requestAnimationFrame(animate);
    }

    this.init = function () {
        cameraTransform = engine.entityManager.getComponent(engine.cameraEntity, Transform);
        cameraPosition = cameraTransform.position;
        cameraTransform.position.onChanged.add(function (x, y, z, _x, _y, _z) {
            target._add(_x - x, _y - y, _z - z);
            cameraDistance = cameraPosition.distanceTo(target);
        });
        cameraDistance = cameraPosition.distanceTo(target);
        camera = engine.camera;
        //
        io.mapKeyBoolean(87, controller, "forward")
            .mapKeyBoolean(83, controller, "back")
            .mapKeyBoolean(65, controller, "left")
            .mapKeyBoolean(68, controller, "right")
            .mapKeyBoolean(81, controller, "rotateLeft")
            .mapKeyBoolean(69, controller, "rotateRight");
    };
    animate();
};
export default Controller;
