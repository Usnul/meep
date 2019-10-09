/**
 * Created by Alex on 28/04/2016.
 */


import Transform from "../ecs/components/Transform";
import Mesh from "../../graphics/ecs/mesh/Mesh";
import Tween from "./Tween";
import GUIElement from "../ecs/components/GUIElement.js";

function doMaterial(m, what) {
    const materials = m.materials;
    if (materials !== undefined) {
        let i = 0;
        const l = materials.length;
        for (; i < l; i++) {
            doMaterial(materials[i], what);
        }
    } else {
        what(m);
    }
}

/**
 *
 * @param {number} entity
 * @param {EntityComponentDataset} ecd
 * @param {Vector3} parameter destination in local offset from current position
 * @param {number} time duration
 * @param {function(x:number):number} transitionFunction
 * @returns {Tween}
 */
function translate(entity, ecd, parameter, time, transitionFunction) {
    const transform = ecd.getComponent(entity, Transform);

    const origin = transform.position.clone();
    const target = origin.clone().add(parameter);

    const temp = origin.clone();
    return new Tween(function (v) {
        const position = transform.position;
        temp.copy(origin).lerp(target, v);
        position.copy(temp);
    }, 0, 1, time, transitionFunction);
}

/**
 *
 * @param {number} entity
 * @param {EntityComponentDataset} ecd
 * @param {Vector3} parameter final opacity, 1 - fully opaque, 0 - fully transparent
 * @param {number} time duration
 * @param {function(x:number):number} transitionFunction
 * @returns {Tween}
 */
function fade(entity, ecd, parameter, time, transitionFunction) {

    const tweenUpdateCallbacks = [];
    const tweenEndCallbacks = [];

    let original = 1;


    /**
     *
     * @type {Mesh}
     */
    const model3d = ecd.getComponent(entity, Mesh);

    if (model3d !== undefined && model3d.mesh !== undefined && model3d.mesh.material !== undefined) {
        const material = model3d.mesh.material.clone();

        //duplicate material so we can modify it
        model3d.mesh.material = material;

        if (parameter < 1) {
            //hide shadows, as in THREE it is currently not possible to adjust strength of shadows per object
            model3d.mesh.castShadow = false;
            model3d.castShadow = false;
        }

        doMaterial(material, function (m) {
            m.transparent = true;
        });

        doMaterial(material, function (m) {
            original = m.opacity;
        });

        tweenUpdateCallbacks.push(function (v) {
            doMaterial(material, function (m) {
                m.opacity = v;
                m.needsUpdate = true;

                model3d.opacity = v;
            });
        });
        tweenEndCallbacks.push(function () {
            doMaterial(material, function (m) {
                m.visible = true;
            });
        });
    }

    const guiElement = ecd.getComponent(entity, GUIElement);

    if (guiElement !== undefined) {
        tweenUpdateCallbacks.push(function (v) {
            guiElement.view.el.style.opacity = v;
        });
    }
    const tween = new Tween(function (v) {
        for (let i = 0; i < tweenUpdateCallbacks.length; i++) {
            tweenUpdateCallbacks[i](v);
        }

    }, original, parameter, time, transitionFunction);

    tweenEndCallbacks.forEach(function (cb) {
        tween.on.ended.add(cb);
    });

    return tween;
}

export default {
    translate: translate,
    fade: fade
};
