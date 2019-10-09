/**
 * Created by Alex on 09/02/2015.
 */
import Vector2 from '../../../core/geom/Vector2';
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";

/**
 *
 * @param {View} view
 * @constructor
 */
function GUIElement(view) {
    /**
     *
     * @type {View}
     */
    this.view = view;
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
     *
     * @type {ObservedBoolean}
     */
    this.visible = new ObservedBoolean(true);
}

GUIElement.typeName = "GUIElement";
GUIElement.serializable = false;

export default GUIElement;
