/**
 * Created by Alex on 09/02/2015.
 */
import Vector2 from '../../../core/geom/Vector2.js';
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";
import { COMPONENT_SERIALIZATION_TRANSIENT_FIELD } from "../storage/COMPONENT_SERIALIZATION_TRANSIENT_FIELD.js";
import { assert } from "../../../core/assert.js";

/**
 *
 * @enum {number}
 */
export const GUIElementFlag = {
    /**
     * If this is set to false GUI element's view will not be managed by the system
     */
    Managed: 1,
    /**
     * Whether or not underlying view has been initialized
     */
    Initialized: 2
};

class GUIElement {
    /**
     *
     * @param {View} [view] parameter is deprecated
     * @constructor
     */
    constructor(view) {
        /**
         *
         * @type {View}
         */
        this.view = null;

        /**
         *
         * @type {String}
         */
        this.klass = null;

        /**
         *
         * @type {Object}
         */
        this.parameters = {};

        /**
         * ranges from 0..1 in both X and Y, controls anchor point of element positioning
         * @type {Vector2}
         */
        this.anchor = new Vector2(0, 0);

        /**
         * Used for visual grouping of elements, system will create and manage named containers to group elements together
         * @readonly
         * @type {String|null}
         */
        this.group = null;

        /**
         * @private
         * @type {number}
         */
        this.flags = GUIElementFlag.Managed;


        /**
         *
         * @type {ObservedBoolean}
         */
        this.visible = new ObservedBoolean(true);


        if (view !== undefined) {
            console.warn('constructor parameters are deprecated');
            this.view = view;

            //set non-serializable flag
            this[COMPONENT_SERIALIZATION_TRANSIENT_FIELD] = true;
        }

    }

    /**
     *
     * @param {number|GUIElementFlag} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|GUIElementFlag} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|GUIElementFlag} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|GUIElementFlag} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    /**
     *
     * @param {View} view
     * @returns {GUIElement}
     */
    static fromView(view) {
        assert.notEqual(view, undefined, 'view is undefined');
        assert.notEqual(view, null, 'view is null');

        const r = new GUIElement();

        r.clearFlag(GUIElementFlag.Managed);
        r.view = view;

        return r;
    }
}

GUIElement.typeName = "GUIElement";
GUIElement.serializable = true;

export default GUIElement;


export class GUIElementSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = GUIElement;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GUIElement} value
     */
    serialize(buffer, value) {

        if (!value.getFlag(GUIElementFlag.Managed)) {
            throw new Error(`Expected 'Managed' flag to be set, instead it was cleared. Cannot serialize un-managed component`);
        }

        value.anchor.toBinaryBufferFloat32(buffer);
        buffer.writeUTF8String(value.group);

        buffer.writeUint8(value.visible.getValue() ? 1 : 0);

        buffer.writeUTF8String(value.klass);
        //write parameters

        const paramKeys = Object.keys(value.parameters);

        const numParamKeys = paramKeys.length;
        buffer.writeUintVar(numParamKeys);

        for (let i = 0; i < numParamKeys; i++) {
            const paramKey = paramKeys[i];

            buffer.writeUTF8String(paramKey);

            const parameter = value.parameters[paramKey];

            const paramType = typeof parameter;

            if (paramType === "number") {
                buffer.writeUint8(1);

                buffer.writeFloat64(parameter);
            } else if (paramType === "boolean") {
                buffer.writeUint8(2);

                buffer.writeUint8(parameter ? 1 : 0);
            } else if (paramType === "string") {
                buffer.writeUint8(3);

                buffer.writeUTF8String(parameter);
            } else {
                throw new TypeError(`Unsupported parameter type ${paramType}`);
            }

        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {GUIElement} value
     */
    deserialize(buffer, value) {
        value.anchor.fromBinaryBufferFloat32(buffer);

        value.group = buffer.readUTF8String();

        value.visible.set(buffer.readUint8() !== 0);

        value.klass = buffer.readUTF8String();

        const numParamKeys = buffer.readUintVar();

        const params = {};

        for (let i = 0; i < numParamKeys; i++) {
            //read key
            const paramKey = buffer.readUTF8String();

            //read type flag
            const paramTypeHeader = buffer.readUint8();

            let paramValue;
            if (paramTypeHeader === 1) {
                //number
                paramValue = buffer.readFloat64();
            } else if (paramTypeHeader === 2) {
                //boolean
                paramValue = buffer.readUint8() !== 0;
            } else if (paramTypeHeader === 3) {
                //string
                paramValue = buffer.readUTF8String();
            } else {
                throw new TypeError(`Unknown type header value '${paramTypeHeader}' for parameter key '${paramKey}'`);
            }

            params[paramKey] = paramValue;
        }

        value.parameters = params;
    }
}
