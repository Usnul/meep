/**
 * Created by Alex Goldring on 25.02.2015.
 */
import Vector3 from "../../../core/geom/Vector3";
import { AABB3 } from "../../../core/bvh2/AABB3";
import { LeafNode } from '../../../core/bvh2/LeafNode';
import { computeHashFloat, computeHashIntegerArray } from "../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../core/strings/StringUtils.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

class Mesh {
    constructor(options) {
        if (options !== undefined) {
            console.warn('Passing arguments into Mesh constructor is deprecated');
        } else {
            options = {};
        }

        /**
         *
         * @type {string|null}
         */
        this.url = options.url !== undefined ? options.url : null;

        if (options.size !== void 0) {
            /**
             * @deprecated
             * @type {Vector3}
             */
            this.size = new Vector3(0, 0, 0);

            if (typeof (options.size) === "number") {
                this.size.set(options.size, options.size, options.size);
            } else {
                this.size.copy(options.size);
            }
        }

        /**
         *
         * @type {*|boolean}
         */

        this.castShadow = options.castShadow || false;
        /**
         *
         * @type {boolean}
         */
        this.receiveShadow = options.receiveShadow || false;

        /**
         *
         * @type {Object3D|null}
         */
        this.mesh = null;

        /**
         * @deprecated
         * @type {boolean}
         */
        this.center = options.center !== undefined ? options.center : false;

        /**
         *
         * @type {number}
         */
        this.opacity = options.opacity !== undefined ? options.opacity : 1;

        /**
         *
         * @type {boolean}
         */
        this.isLoaded = false;

        /**
         *
         * @type {LeafNode}
         */
        this.bvh = new LeafNode(null, 0, 0, 0, 0, 0, 0);

        /**
         * Initialized to size 1x1x1
         * @type {AABB3}
         */
        this.boundingBox = new AABB3(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5);
    }

    /**
     *
     * @returns {boolean}
     */
    hasMesh() {
        return this.mesh !== undefined && this.mesh !== null;
    }

    fromJSON(obj) {
        if (obj.url !== undefined) {
            this.url = obj.url;
        }
        if (obj.size !== undefined) {
            if (this.size === undefined) {
                this.size = new Vector3(0, 0, 0);
            }
            this.size.fromJSON(obj.size);
        }
        if (obj.castShadow !== undefined) {
            this.castShadow = obj.castShadow;
        }
        if (obj.receiveShadow !== undefined) {
            this.receiveShadow = obj.receiveShadow;
        }
        if (obj.center !== undefined) {
            this.center = obj.center;
        }
        if (obj.opacity !== undefined) {
            this.opacity = obj.opacity;
        }
    }

    toJSON() {
        const result = {
            url: this.url,
            castShadow: this.castShadow,
            receiveShadow: this.receiveShadow,
            center: this.center,
            opacity: this.opacity
        };

        if (this.size !== undefined) {
            //deprecated attribute
            result.size = this.size.toJSON();
        }

        return result;
    }

    hash() {
        let urlHash = computeStringHash(this.url);
        return computeHashIntegerArray(
            urlHash,
            this.castShadow ? 1 : 0,
            this.receiveShadow ? 1 : 0,
            this.center ? 1 : 0,
            computeHashFloat(this.opacity)
        );
    }

    /**
     *
     * @param {Mesh} other
     */
    copy(other) {
        this.url = other.url;

        if (other.size !== undefined) {
            //deprecated attribute
            if (this.size === undefined) {
                this.size = other.size.clone();
            } else {
                this.size.copy(other.size);
            }
        } else {
            delete this.size;
        }

        this.castShadow = other.castShadow;
        this.receiveShadow = other.receiveShadow;
        this.center = other.center;
        this.opacity = other.opacity;
    }

    /**
     *
     * @returns {Mesh}
     */
    clone() {
        const clone = new Mesh();

        clone.copy(this);

        return clone;
    }

    /**
     *
     * @param json
     * @returns {Mesh}
     */
    static fromJSON(json) {
        const result = new Mesh();

        result.fromJSON(json);

        return result;
    }
}


Mesh.typeName = "Mesh";

export default Mesh;

export class MeshSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Mesh;
        this.version = 0;
    }


    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Mesh} value
     */
    serialize(buffer, value) {
        buffer.writeUTF8String(value.url);
        buffer.writeUint8(value.castShadow ? 1 : 0);
        buffer.writeUint8(value.receiveShadow ? 1 : 0);
        buffer.writeUint8(value.center ? 1 : 0);
        buffer.writeFloat32(value.opacity);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Mesh} value
     */
    deserialize(buffer, value) {
        value.url = buffer.readUTF8String();
        value.castShadow = buffer.readUint8() !== 0;
        value.receiveShadow = buffer.readUint8() !== 0;
        value.center = buffer.readUint8() !== 0;
        value.opacity = buffer.readFloat32();
    }

}
