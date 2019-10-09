import ObservedBoolean from "../../../model/core/model/ObservedBoolean.js";
import List from "../../../model/core/collection/List.js";
import { assert } from "../../../model/core/assert.js";
import DataType from "../../../model/core/parser/simple/DataType.js";

export class InteractionCommand {
    /**
     *
     * @param {string} id
     * @param {ObservedBoolean|ReactiveExpression} [enabled]
     * @param {string[]} [features]
     * @param {function} action
     */
    constructor({ id, enabled = new ObservedBoolean(true), features = [], action }) {
        assert.typeOf(id, 'string', 'id');
        assert.typeOf(action, 'function', 'action');

        assert.notEqual(enabled, undefined, 'enabled is undefined');
        assert.notEqual(enabled, null, 'enabled is null');
        assert.ok(enabled.isObservedBoolean || (enabled.isReactiveExpression && enabled.dataType === DataType.Boolean), `enabled is not an ObservedBoolean`);

        assert.ok(Array.isArray(features), 'features is not an array');

        /**
         *
         * @type {string}
         */
        this.id = id;

        /**
         *
         * @type {ObservedBoolean|ReactiveExpression}
         */
        this.enabled = enabled;

        /**
         *
         * @type {List<String>}
         */
        this.features = new List(features);

        /**
         *
         * @type {Function}
         */
        this.action = action;
    }

    /**
     *
     * @param {string} feature
     * @param {boolean} value
     */
    setFeature(feature, value) {
        if (value && !this.features.contains(feature)) {
            this.features.add(feature);
        } else if (!value && this.features.contains(feature)) {
            this.features.removeOneOf(feature);
        }
    }
}
