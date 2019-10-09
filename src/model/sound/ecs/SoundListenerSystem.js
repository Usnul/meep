/**
 * User: Alex Goldring
 * Date: 11/6/2014
 * Time: 21:47
 */
import { System } from '../../engine/ecs/System';
import SoundListener from './SoundListener';
import Transform from '../../engine/ecs/components/Transform';
import { browserInfo } from "../../engine/Platform";


class SoundListenerSystem extends System {
    /**
     *
     * @param {AudioContext} context
     * @constructor
     */
    constructor(context) {
        super();
        this.componentClass = SoundListener;
        //
        this.webAudioContext = context;
    }

    update(timeDelta) {

        const context = this.webAudioContext;
        const listener = context.listener;
        const entityManager = this.entityManager;
        entityManager.traverseEntities([SoundListener, Transform], function (soundListener, transform, entity) {
            const p = transform.position;
            setListenerPosition(listener, p);
        });


    }
}


/**
 *
 * @param {AudioListener} listener
 * @param {Vector3} position
 */
function setListenerPosition2(listener, position) {
    if (Number.isFinite(position.x)) {
        listener.positionX.setValueAtTime(position.x, 0);
    } else {
        console.error(`Couldn't set X(=${position.x}), because it is not finite`);
    }

    if (Number.isFinite(position.y)) {
        listener.positionY.setValueAtTime(position.y, 0);
    } else {
        console.error(`Couldn't set Y(=${position.y}), because it is not finite`);
    }

    if (Number.isFinite(position.z)) {
        listener.positionZ.setValueAtTime(position.z, 0);
    } else {
        console.error(`Couldn't set Z(=${position.z}), because it is not finite`);
    }
}

/**
 *
 * @param {AudioListener} listener
 * @param {Vector3} position
 */
function setListenerPosition1(listener, position) {
    let x, y, z;
    if (Number.isFinite(position.x)) {
        x = position.x;
    } else {
        x = 0;
        console.error(`Couldn't set X(=${position.x}), because it is not finite`);
    }

    if (Number.isFinite(position.y)) {
        y = position.y;
    } else {
        y = 0;
        console.error(`Couldn't set Y(=${position.y}), because it is not finite`);
    }

    if (Number.isFinite(position.z)) {
        z = position.z;
    } else {
        z = 0;
        console.error(`Couldn't set Z(=${position.z}), because it is not finite`);
    }

    listener.setPosition(x, y, z);
}

/**
 *
 * @param {AudioListener} listener
 * @param {Vector3} position
 */
function setListenerPositionNOOP(listener, position) {
    //does nothing
}

let setListenerPosition = setListenerPositionNOOP;
if (navigator !== undefined) {
    const info = browserInfo();
    if (info.name === "Chrome") {
        if (info.version >= 64) {
            setListenerPosition = setListenerPosition2;
        } else {
            setListenerPosition = setListenerPosition1;
        }
    } else if (info.name === "Firefox") {
        setListenerPosition = setListenerPosition1;
    }
}

if (setListenerPosition === setListenerPositionNOOP) {
    console.warn("No support for AudioListener position detected");
}

export default SoundListenerSystem;
