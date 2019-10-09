/**
 *
 * @param {Array} componentTypes
 * @param {function(components:Array)} completedCallback "this" parameter will be set to entity ID
 * @param {function(components:Array)} brokenCallback "this" parameter will be set to entity ID
 * @constructor
 * @class
 */
import { BitSet } from "../../core/binary/BitSet.js";

/**
 *
 * @param {Array} componentTypes
 * @param {function} completedCallback
 * @param {function} brokenCallback
 * @param {*} [thisArg=undefined] will assume {@link this} value inside callbacks
 * @constructor
 */
function EntityObserver(componentTypes, completedCallback, brokenCallback, thisArg) {
    const numComponentTypes = componentTypes.length;

    if (numComponentTypes < 1) {
        throw new Error(`Observer has to have at least 1 component types to watch, instead was given ${numComponentTypes}`);
    }

    /**
     * @type {number}
     */
    this.componentTypeCount = numComponentTypes;

    /**
     *
     * @type {function(Array)}
     */
    this.callbackComplete = completedCallback;

    /**
     *
     * @type {function(Array)}
     */
    this.callbackBroken = brokenCallback;

    /**
     *
     * @type {Array}
     */
    this.componentTypes = componentTypes;

    this.thisArg = thisArg;


    /**
     *
     * @type {BitSet}
     */
    this.componentMask = new BitSet();

    /**
     * Mapping from component index to position in array of observed component types,
     * this is used to build arguments for callbacks
     * @type {number[]}
     */
    this.componentIndexMapping = [];
}

/**
 *
 * @param {Array} componentTypeMap
 */
EntityObserver.prototype.build = function (componentTypeMap) {
    let i;

    this.componentIndexMapping = [];
    this.componentMask.reset();


    for (i = 0; i < this.componentTypeCount; i++) {
        const componentType = this.componentTypes[i];

        const componentTypeIndex = componentTypeMap.indexOf(componentType);

        if (componentTypeIndex === -1) {
            throw new Error(`Component type was not found in the supplied map. Observer is not compatible.`);
        }

        this.componentMask.set(componentTypeIndex, true);

        this.componentIndexMapping[componentTypeIndex] = i;
    }

};

/**
 *
 * @param {EntityComponentDataset} dataset
 */
EntityObserver.prototype.connect = function (dataset) {
    dataset.addObserver(this, true);
};

EntityObserver.prototype.disconnect = function () {
    //de-register updates
    this.dataset.removeObserver(this);

    this.dataset = null;
};

export {
    EntityObserver
};

