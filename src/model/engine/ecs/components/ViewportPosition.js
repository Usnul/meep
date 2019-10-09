/**
 * Created by Alex on 28/01/2015.
 */

import Vector2 from "../../../core/geom/Vector2";
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";

/**
 *
 * @param {Vector2} [position]
 * @param {Vector2} [offset]
 * @constructor
 */
function ViewportPosition({ position, offset } = {}) {
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

ViewportPosition.typeName = "ViewportPosition";
ViewportPosition.serializable = false;

ViewportPosition.fromJSON = function (opt) {
    const p = new ViewportPosition();

    p.fromJSON(opt);

    return p;
};

ViewportPosition.prototype.fromJSON = function (
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
};

export default ViewportPosition;
