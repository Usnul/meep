import Vector2 from "../../core/geom/Vector2.js";

export function TerrainPreview() {
    this.url = null;
    /**
     *
     * @type {Vector2}
     */
    this.offset = new Vector2(0, 0);
    /**
     *
     * @type {Vector2}
     */
    this.scale = new Vector2(1, 1);
}

TerrainPreview.prototype.toJSON = function () {
    return {
        url: this.url,
        offset: this.offset.toJSON(),
        scale: this.scale.toJSON()
    };
};

TerrainPreview.prototype.fromJSON = function (obj) {
    this.url = obj.url;
    this.offset.fromJSON(obj.offset);
    this.scale.fromJSON(obj.scale);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
TerrainPreview.prototype.toBinaryBuffer = function (buffer) {
    buffer.writeUTF8String(this.url);

    this.offset.toBinaryBuffer(buffer);
    this.scale.toBinaryBuffer(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
TerrainPreview.prototype.fromBinaryBuffer = function (buffer) {
    this.url = buffer.readUTF8String();

    this.offset.fromBinaryBuffer(buffer);
    this.scale.fromBinaryBuffer(buffer);
};