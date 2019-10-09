import ObservedString from "../../../core/model/ObservedString";
import List from "../../../core/collection/List";
import ObservedBoolean from "../../../core/model/ObservedBoolean";
import { InstancedFoliage } from "../InstancedFoliage.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

function FoliageLayer() {
    this.data = new InstancedFoliage();

    this.modelURL = new ObservedString("");

    /**
     *
     * @type {ObservedString}
     */
    this.dataURL = new ObservedString("");

    /**
     *
     * @type {ObservedBoolean}
     */
    this.castShadow = new ObservedBoolean(false);

    /**
     *
     * @type {ObservedBoolean}
     */
    this.receiveShadow = new ObservedBoolean(false);
}

FoliageLayer.prototype.fromJSON = function (data) {
    this.modelURL.fromJSON(data.modelURL);
    this.dataURL.fromJSON(data.dataURL);
    this.castShadow.fromJSON(data.castShadow);
    this.receiveShadow.fromJSON(data.receiveShadow);
};

FoliageLayer.prototype.toJSON = function () {
    return {
        modelURL: this.modelURL.toJSON(),
        dataURL: this.dataURL.toJSON(),
        castShadow: this.castShadow.toJSON(),
        receiveShadow: this.receiveShadow.toJSON()
    };
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
FoliageLayer.prototype.toBinaryBuffer = function (buffer) {
    this.modelURL.toBinaryBuffer(buffer);
    this.castShadow.toBinaryBuffer(buffer);
    this.receiveShadow.toBinaryBuffer(buffer);

    this.data.serialize(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
FoliageLayer.prototype.fromBinaryBuffer = function (buffer) {
    this.modelURL.fromBinaryBuffer(buffer);
    this.castShadow.fromBinaryBuffer(buffer);
    this.receiveShadow.fromBinaryBuffer(buffer);

    this.data.deserialize(buffer);
};

function Foliage2() {
    /**
     *
     * @type {List.<FoliageLayer>}
     */
    this.layers = new List();
}

Foliage2.typeName = "Foliage2";

Foliage2.prototype.toJSON = function () {
    return this.layers.toJSON();
};

Foliage2.prototype.fromJSON = function (data) {
    this.layers.fromJSON(data, FoliageLayer);
};

export { Foliage2, FoliageLayer };

export class InstancedMeshSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = Foliage2;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Foliage2} value
     */
    serialize(buffer, value) {

        value.layers.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Foliage2} value
     */
    deserialize(buffer, value) {

        value.layers.fromBinaryBuffer(buffer, FoliageLayer);
    }
}
