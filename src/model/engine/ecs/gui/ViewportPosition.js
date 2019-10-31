/**
 * Created by Alex on 28/01/2015.
 */

import Vector2 from "../../../core/geom/Vector2.js";
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

/**
 * @readonly
 * @enum {number}
 */
export const ViewportPositionFlags = {
    StickToScreenEdge: 1,
    ResolveGUICollisions: 2,
};

class ViewportPosition {
    /**
     *
     * @param {Vector2} [position]
     * @param {Vector2} [offset]
     * @constructor
     */
    constructor({ position, offset } = {}) {
        /**
         * Clip-scale position, on-screen values are in range of 0 to 1
         * @type {Vector2}
         */
        this.position = new Vector2();

        /**
         * Fixed offset in pixels
         * @type {Vector2}
         */
        this.offset = new Vector2();
        /**
         * ranges from 0..1 in both X and Y, controls anchor point of element positioning
         * @type {Vector2}
         */
        this.anchor = new Vector2(0, 0);


        /**
         * Makes display element avoid overlap with GUI elements
         * @see GUIElement
         * @type {boolean}
         */
        this.resolveGuiCollisions = false;

        /**
         * How far should the HUD stay away from the edge if it's sticky
         * @see stickToScreenEdge
         * @type {number}
         */
        this.screenEdgeWidth = 10;


        /**
         * Controls whenever or not HUD should remain on the screen when it gets to the edge
         * @type {boolean}
         */
        this.stickToScreenEdge = false;

        /**
         * Can be used to enable and disable positioning
         * @type {ObservedBoolean}
         */
        this.enabled = new ObservedBoolean(true);

        if (position !== void 0) {
            this.position.copy(position);
        }

        if (offset !== void 0) {
            this.offset.copy(offset);
        }
    }

    fromJSON(
        {
            position = Vector2.zero,
            offset = Vector2.zero,
            anchor = Vector2.zero,
            screenEdgeWidth = 0,
            stickToScreenEdge = false,
            enabled = true,
        }
    ) {
        this.position.fromJSON(position);
        this.offset.fromJSON(offset);
        this.anchor.fromJSON(anchor);
        this.screenEdgeWidth = screenEdgeWidth;
        this.stickToScreenEdge = stickToScreenEdge;
        this.enabled.fromJSON(enabled);
    }

    static fromJSON(opt) {
        const p = new ViewportPosition();

        p.fromJSON(opt);

        return p;
    }
}

ViewportPosition.typeName = "ViewportPosition";
ViewportPosition.serializable = true;

export default ViewportPosition;

export class ViewportPositionSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.version = 0;
        this.klass = ViewportPosition;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ViewportPosition} value
     */
    serialize(buffer, value) {
        value.position.toBinaryBufferFloat32(buffer);
        value.offset.toBinaryBufferFloat32(buffer);
        value.anchor.toBinaryBufferFloat32(buffer);

        buffer.writeFloat32(value.screenEdgeWidth);

        buffer.writeUint8(value.resolveGuiCollisions ? 1 : 0);
        buffer.writeUint8(value.stickToScreenEdge ? 1 : 0);
        buffer.writeUint8(value.enabled.getValue() ? 1 : 0);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ViewportPosition} value
     */
    deserialize(buffer, value) {
        value.position.fromBinaryBufferFloat32(buffer);
        value.offset.fromBinaryBufferFloat32(buffer);
        value.anchor.fromBinaryBufferFloat32(buffer);

        value.screenEdgeWidth = buffer.readFloat32();

        value.resolveGuiCollisions = buffer.readUint8() !== 0;
        value.stickToScreenEdge = buffer.readUint8() !== 0;
        value.enabled.set(buffer.readUint8() !== 0);
    }
}
