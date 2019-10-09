/**
 * Created by Alex on 27/05/2016.
 * @copyright Alex Goldring 2016
 */


import View from "../../View";
import { assert } from "../../../model/core/assert.js";
import { noop } from "../../../model/core/function/Functions.js";

export class ListView extends View {
    /**
     * List representation
     * @template E
     * @param {List<E>} model List to be represented
     * @param {string[]} [classList] collection of CSS classes
     * @param {function(E):View} elementFactory factory function, takes a list element and returns a view
     * @param {function(E, View, number, ListView<E>)} [addHook] hook function to be called when a view is created
     * @param {function(E, View, number, ListView<E>)} [removeHook] hook function to be called when a view is created
     * @constructor
     */
    constructor(model, {
        classList = [],
        elementFactory,
        addHook = noop,
        removeHook = noop,
    }) {
        super();

        assert.typeOf(elementFactory, 'function', 'elementFactory');

        /**
         *
         * @type {List<E>}
         */
        this.model = model;

        this.elementFactory = elementFactory;

        this.hooks = {
            add: addHook,
            remove: removeHook
        };

        this.el = document.createElement('div');

        this.addClass('ui-list-view');

        classList.forEach((className) => {
            this.addClass(className);
        });


        this.bindSignal(model.on.added, this.insertOne, this);
        this.bindSignal(model.on.removed, this.removeOne, this);

        /**
         *
         * @type {Map<E, View>}
         */
        this.viewMapping = new Map();

        // initialization
        this.on.linked.add(() => {
            model.forEach(this.addOne, this);
        });

        // cleanup
        this.on.unlinked.add(this.removeAllChildren, this);
    }

    insertOne(el, index) {
        const elementView = this.addOne(el, index);

        if (this.model.length !== index + 1) {
            //this is not the last element in the list, we need to patch it into the right place inside the DOM
            const nextElement = this.model.get(index + 1);
            const nextChild = this.getChildByElement(nextElement);

            this.el.insertBefore(elementView.el, nextChild.el);
        }

    }

    /**
     *
     * @param {E} el
     * @param {number} index
     * @returns {View}
     */
    addOne(el, index) {
        /**
         * @type {View}
         */
        const elementView = this.elementFactory(el);

        assert.notEqual(elementView, undefined, 'elementFactory produced undefined instead of a view');
        assert.notEqual(elementView, null, 'elementFactory produced a null instead of a view');

        this.viewMapping.set(el, elementView);

        this.addChild(elementView);

        this.hooks.add(el, elementView, index, self);

        return elementView;
    }

    /**
     *
     * @param {E} el
     * @param {number} index
     */
    removeOne(el, index) {
        const children = this.children;

        const i = this.getChildIndexByElement(el);

        //clear mapping
        this.viewMapping.delete(el);

        if (i === -1) {

            console.error('Failed to find view for element ', el);


        }else{

            const child = children[i];


            this.removeChild(child);

            this.hooks.remove(el, child, index, this);
        }
    }

    /**
     *
     * @param {E} el
     * @returns {number} -1 if not found
     */
    getChildIndexByElement(el) {
        const view = this.viewMapping.get(el);

        if (view === undefined) {
            return -1;
        }

        return this.children.indexOf(view);
    }

    /**
     *
     * @param {E} el
     * @returns {View|null}
     */
    getChildByElement(el) {
        return this.viewMapping.get(el);
    }
}

// Inherit View prototype


export default ListView;
