/**
 * Created by Alex on 09/08/2016.
 */


import List from '../../../../model/core/collection/List.js';
import { Draggable } from "./Draggable.js";
import { DropTarget } from "./DropTarget.js";


function DragAndDropContext() {
    /**
     *
     * @type {List<Draggable>}
     */
    this.elements = new List();
    /**
     *
     * @type {List<DropTarget>}
     */
    this.targets = new List();
}

DragAndDropContext.prototype.getElementById = function (id) {
    const elements = this.elements;
    let i = 0;
    const l = elements.length;
    for (; i < l; i++) {
        const draggable = elements.get(i);
        if (draggable.id === id) {
            return draggable;
        }
    }
    //not found
    return null;
};

/**
 *
 * @param {View} view
 * @param domain
 * @param {function} validation
 * @returns {DropTarget}
 */
DragAndDropContext.prototype.addTarget = function (view, domain, validation) {
    const dropTarget = new DropTarget(view, domain, validation);

    dropTarget.context = this;

    dropTarget.link();

    this.targets.add(dropTarget);

    return dropTarget;
};

/**
 *
 * @param {View} view
 */
DragAndDropContext.prototype.removeTarget = function (view) {
    const targets = this.targets;
    const filtered = targets.filter(function (target) {
        return target.view === view;
    });

    filtered.forEach(function (t) {
        t.unlink();
        targets.removeOneOf(t);
    });

};

/**
 *
 * @param {View} view
 * @param {DropTarget} parent
 * @returns {Draggable}
 */
DragAndDropContext.prototype.addElement = function (view, parent) {
    const draggable = new Draggable(view, parent);

    draggable.link();

    this.elements.add(draggable);

    return draggable;
};

/**
 *
 * @param {Draggable} el
 * @returns {boolean}
 */
DragAndDropContext.prototype.removeElement = function (el) {
    const i = this.elements.indexOf(el);
    if (i === -1) {
        //not found
        return false;
    } else {
        el.unlink();
        this.elements.remove(i);
        return true;
    }
};

/**
 *
 * @param {Draggable} el
 */
DragAndDropContext.prototype.initializeDrag = function (el) {

};

/**
 *
 * @param {Draggable} el
 */
DragAndDropContext.prototype.finalizeDrag = function (el) {

};

export { DragAndDropContext, Draggable, DropTarget };