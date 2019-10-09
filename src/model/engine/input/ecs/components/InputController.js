/**
 * Created by Alex on 09/10/2015.
 */

import List from '../../../../core/collection/List';
import { assert } from "../../../../core/assert.js";

class InputControllerBinding {
    /**
     *
     * @param {string} path
     * @param {function} listener
     * @param {boolean} [exclusive=false]
     */
    constructor({ path, listener, exclusive = false }) {
        /**
         *
         * @type {string}
         */
        this.path = path;
        /**
         *
         * @type {Function}
         */
        this.listener = listener;
        /**
         *
         * @type {boolean}
         */
        this.exclusive = exclusive;
    }
}

/**
 *
 * @param {Array} bindings
 * @constructor
 */
function InputController(bindings = []) {
    assert.ok(Array.isArray(bindings), 'Expected bindings to be an array, instead got something else');

    this.mapping = new List();

    const inputControllerBindings = bindings.map(b => new InputControllerBinding(b));

    this.mapping.addAll(inputControllerBindings);
}

InputController.typeName = "InputController";
InputController.serializable = false;

export default InputController;