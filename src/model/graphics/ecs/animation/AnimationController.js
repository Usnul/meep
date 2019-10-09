/**
 * Created by Alex on 15/11/2016.
 */


import List from '../../../core/collection/List';
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

function AnimationRule(startEvent, animationName, speed, transitionTime, loop = false) {
    this.startEvent = startEvent;
    this.stopEvent = null;
    this.animation = animationName;
    this.speed = speed;
    this.transition = transitionTime;
    this.weight = 1;
    this.loop = loop;
}

AnimationRule.prototype.toJSON = function () {
    return {
        startEvent: this.startEvent,
        stopEvent: this.stopEvent,
        animation: this.animation,
        speed: this.speed,
        transition: this.transition,
        loop: this.loop,
        weight: this.weight
    };
};

AnimationRule.prototype.fromJSON = function (json) {

    this.startEvent = json.startEvent;
    this.stopEvent = json.stopEvent;

    this.animation = json.animation;

    if (typeof json.speed === "number") {
        this.speed = json.speed;
    } else {
        this.speed = 1;
    }

    this.transition = json.transition;

    if (typeof json.loop === "boolean") {
        this.loop = json.loop;
    } else {
        this.loop = false;
    }

    if (typeof json.weight === "number") {
        this.weight = json.weight;
    } else {
        this.weight = 1;
    }
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
AnimationRule.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUTF8String(this.animation);
    buffer.writeUTF8String(this.startEvent);
    buffer.writeUTF8String(this.stopEvent);

    buffer.writeUint8(this.loop ? 1 : 0);
    buffer.writeFloat64(this.weight);
    buffer.writeFloat64(this.transition);
    buffer.writeFloat64(this.speed);

};

/**
 *
 * @param {BinaryBuffer} buffer
 */
AnimationRule.prototype.fromBinaryBuffer = function (buffer) {
    this.animation = buffer.readUTF8String();
    this.startEvent = buffer.readUTF8String();
    this.stopEvent = buffer.readUTF8String();

    this.loop = buffer.readUint8() !== 0;
    this.weight = buffer.readFloat64();
    this.transition = buffer.readFloat64();
    this.speed = buffer.readFloat64();
};

/**
 *
 * @constructor
 */
function AnimationController() {
    /**
     *
     * @type {List<AnimationRule>}
     */
    this.rules = new List();
}

AnimationController.typeName = "AnimationController";

/**
 *
 * @param json
 * @returns {AnimationController}
 */
AnimationController.fromJSON = function (json) {
    const r = new AnimationController();

    r.fromJSON(json);

    return r;
};

AnimationController.prototype.fromJSON = function (json) {
    this.rules.fromJSON(json, AnimationRule);
};
AnimationController.prototype.toJSON = function () {
    return this.rules.toJSON();
};

export default AnimationController;


export class AnimationControllerSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = AnimationController;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {AnimationController} value
     */
    serialize(buffer, value) {
        value.rules.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {AnimationController} value
     */
    deserialize(buffer, value) {
        value.rules.fromBinaryBuffer(buffer, AnimationRule);
    }
}
