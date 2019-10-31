/**
 * Created by Alex on 06/03/2017.
 */


import Vector2 from '../../../../core/geom/Vector2';
import Script from '../../../ecs/components/Script';
import EntityBuilder from '../../../ecs/EntityBuilder';
import InputController from '../components/InputController';
import { assert } from "../../../../core/assert.js";
import { Tag } from "../../../ecs/components/Tag.js";
import { SerializationMetadata } from "../../../ecs/components/SerializationMetadata.js";


/**
 *
 * @param {TopDownCameraController} topDownCameraController
 * @constructor
 */
function KeyboardCameraController(topDownCameraController) {
    assert.notEqual(topDownCameraController, undefined, 'controller is undefined');

    const cameraPanSpeed = new Vector2(0, 0);

    const controls = {
        panUp: false,
        panDown: false,
        panLeft: false,
        panRight: false
    };

    const keyboardPanSpeed = 10;

    const inputController = new InputController();

    function registerToggle(keys, object, propertyName) {
        keys.forEach((keyName) => {

            inputController.mapping.add({
                path: "keyboard/keys/" + keyName + "/down",
                listener: () => object[propertyName] = true
            });
            inputController.mapping.add({
                path: "keyboard/keys/" + keyName + "/up",
                listener: () => object[propertyName] = false
            });
        });
    }

    registerToggle(["down_arrow", "s"], controls, "panDown");
    registerToggle(["up_arrow", "w"], controls, "panUp");
    registerToggle(["left_arrow", "a"], controls, "panLeft");
    registerToggle(["right_arrow", "d"], controls, "panRight");

    const script = new Script(function (timeDelta) {
        cameraPanSpeed.set(0, 0);

        if (controls.panDown) {
            cameraPanSpeed.y += 1;
        }
        if (controls.panUp) {
            cameraPanSpeed.y -= 1;
        }
        if (controls.panLeft) {
            cameraPanSpeed.x -= 1;
        }
        if (controls.panRight) {
            cameraPanSpeed.x += 1;
        }

        if (cameraPanSpeed.isZero()) {
            // not panning
            return;
        }

        let displacement = cameraPanSpeed.clone().multiplyScalar(keyboardPanSpeed * timeDelta);
        topDownCameraController.target._add(displacement.x, 0, displacement.y);
    });

    this.builder = new EntityBuilder()
        .add(inputController)
        .add(SerializationMetadata.Transient)
        .add(Tag.fromJSON(['Keyboard Camera Controller']))
        .add(script);
}

/**
 * @param {EntityComponentDataset} em
 */
KeyboardCameraController.prototype.build = function (em) {
    return this.builder.build(em);
};

export default KeyboardCameraController;
