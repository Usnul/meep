/**
 * Created by Alex on 20/09/2015.
 */
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

function Highlight(options) {

    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;

    if (options !== undefined) {
        console.warn('Highlight constructor arguments are deprecated');
        this.fromJSON(options);
    }
}

Highlight.typeName = "Highlight";

/**
 *
 * @param json
 * @returns {Highlight}
 */
Highlight.fromJSON = function (json) {
    const r = new Highlight();

    r.fromJSON(json);

    return r;
};

Highlight.prototype.toJSON = function () {
    return {
        r: this.r,
        g: this.g,
        b: this.b,
        a: this.a
    };
};

Highlight.prototype.fromJSON = function (json) {
    this.r = (typeof json.r === 'number') ? json.r : 1;
    this.g = (typeof json.g === 'number') ? json.g : 1;
    this.b = (typeof json.b === 'number') ? json.b : 1;
    this.a = (typeof json.a === 'number') ? json.a : 1;
};

export default Highlight;

export class HighlightSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        this.klass = Highlight;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Highlight} value
     */
    serialize(buffer, value) {
        buffer.writeFloat32(value.r);
        buffer.writeFloat32(value.g);
        buffer.writeFloat32(value.b);
        buffer.writeFloat32(value.a);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Highlight} value
     */
    deserialize(buffer, value) {
        value.r = buffer.readFloat32();
        value.g = buffer.readFloat32();
        value.b = buffer.readFloat32();
        value.a = buffer.readFloat32();
    }
}
