/**
 *
 * @enum {number}
 */
import View from "../../View";
import EmptyView from "../elements/EmptyView";
import AABB2 from "../../../model/core/geom/AABB2";
import Task from "../../../model/core/process/task/Task";
import ConcurrentExecutor from "../../../model/core/process/executor/ConcurrentExecutor.js";
import TaskSignal from "../../../model/core/process/task/TaskSignal";
import TooltipView from "./TooltipView";
import { PointerDevice } from "../../../model/engine/input/devices/PointerDevice.js";
import List from "../../../model/core/collection/List.js";
import { assert } from "../../../model/core/assert.js";
import { GMLEngine } from "./GMLEngine.js";

/**
 *
 * @param {Element} node
 * @param {AABB2} result
 */
export function readNodeAABB(node, result) {
    /**
     *
     * @type {ClientRect | DOMRect}
     */
    const rect = node.getBoundingClientRect();

    result.set(rect.left, rect.top, rect.right, rect.bottom);
}

/**
 *
 * @param {Element} node
 * @param {number} x
 * @param {number} y
 */
function pickElementsByPosition(node, x, y) {
    const aabb2 = new AABB2();


    const hits = [];

    /**
     *
     * @param {Element} node
     * @param {number} level
     */
    function test(node, level) {

        let i;

        readNodeAABB(node, aabb2);

        if (aabb2.containsPoint(x, y)) {
            hits.push({
                node,
                level
            });
        }
        const children = node.children;

        const numChildren = children.length;

        for (i = 0; i < numChildren; i++) {
            const element = children[i];

            test(element, level + 1);
        }

    }

    test(node, 0);

    //sort the elements by their depth
    hits.sort(function (a, b) {
        return a.level - b.level;
    });

    const result = hits.map(function (element) {
        return element.node;
    });

    return result;
}

class Tooltip {
    constructor() {
        this.sourceElement = null;

        /**
         *
         * @type {TooltipView|null}
         */
        this.tipView = null;
    }

    /**
     *
     * @param {Tooltip} other
     */
    equals(other) {
        return this.sourceElement === other.sourceElement && this.code === other.code;
    }
}


class TooltipManager {

    constructor() {
        /**
         * @private
         * @type {GMLEngine}
         */
        this.gml = null;

        /**
         *
         * @type {View|null}
         */
        this.contextView = new EmptyView();

        this.contextView.addClass('ui-tooltip-manager-context');


        /**
         *
         * @type {PointerDevice}
         */
        this.pointer = null;


        const self = this;

        this.updateTask = new Task({
            name: "Update Tooltip Cursor",
            cycleFunction: function () {
                const position = self.pointer.position;
                self.update(position.x, position.y);

                return TaskSignal.Yield;
            }
        });

        this.executor = new ConcurrentExecutor(500, 0.00001);

        /**
         *
         * @type {List<VisualTip>}
         */
        this.tips = new List();
    }

    /**
     *
     * @returns {GMLEngine}
     */
    getGML() {
        return this.gml;
    }

    /**
     *
     * @param {GMLEngine} gml
     * @param {PointerDevice} pointer
     */
    initialize(gml, pointer) {
        this.gml = gml;

        /**
         *
         * @type {PointerDevice}
         */
        this.pointer = pointer;


        this.signalBindings = [];
    }

    startup() {
        const self = this;

        return new Promise(function (resolve, reject) {
            if (self.database === null) {
                throw new Error('Database not set; probably not initialized');
            }

            if (self.contextView === null) {
                throw new Error('ContextView not set; probably not initialized');
            }

            self.signalBindings.forEach(b => b.link());

            self.executor.run(self.updateTask);

            self.gml.startup().then(resolve, reject);
        });
    }

    shutdown() {
        const self = this;

        return new Promise(function (resolve, reject) {
            self.signalBindings.forEach(b => b.unlink());

            self.executor.removeTask(self.updateTask);

            resolve();
        });
    }

    update() {
        //TODO do update stuff

        /*

        this.tips.forEach(t => {
            this.positionTip(t.view);
        });

         */
    }

    /**
     *
     * @param {VisualTip} tip
     */
    buildTipView(tip) {
        const gml = this.getGML();

        gml.pushState();
        gml.setTooltipsEnabled(false);

        //build tip content
        const factoryProduct = tip.factory();

        gml.popState();

        assert.notEqual(factoryProduct, undefined, "factory product was undefined");
        assert.notEqual(factoryProduct, null, "factory product was null");

        let contentView;
        if (typeof factoryProduct === "object") {
            //expecting factory product to be a view, passing it directly

            contentView = factoryProduct;

        } else {
            //treat as a normal string, compile
            const code = factoryProduct.toString();

            //build content view
            contentView = this.gml.compile(code);
        }

        const view = new TooltipView(tip, contentView);

        tip.view = view;

        return view;
    }

    /**
     *
     * @param {VisualTip} tip
     */
    add(tip) {
        const contextView = this.contextView;

        //build tip view
        const tooltipView = this.buildTipView(tip);

        //make transparent
        tooltipView.css({
            opacity: 0
        });

        requestAnimationFrame(() => {
            this.positionTip(tooltipView);

            tooltipView.css({
                opacity: 1
            });
        });

        contextView.addChild(tooltipView);

        //remember tip
        this.tips.add(tip);
    }

    /**
     *
     * @param {VisualTip} tip
     */
    remove(tip) {
        const removed = this.tips.removeOneOf(tip);

        if (removed) {
            this.contextView.removeChild(tip.view);

            //clear out the view
            tip.view = null;
        }
    }

    positionTip(tipView) {
        if (tipView === null) {
            return;
        }

        const contextView = this.contextView;

        const bounds = new AABB2(0, 0, contextView.size.x, contextView.size.y);

        tipView.layout(bounds);
    }


}

export { TooltipManager };
