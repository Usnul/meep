import Signal from "../../../model/core/events/signal/Signal.js";
import { MouseEvents } from "../../../model/engine/input/devices/events/MouseEvents.js";
import { VisualTip } from "./VisualTip.js";
import Rectangle from "../../../model/core/geom/Rectangle.js";
import { SignalBinding } from "../../../model/core/events/signal/SignalBinding.js";
import { DomSizeObserver } from "../util/DomSizeObserver.js";
import ObservedBoolean from "../../../model/core/model/ObservedBoolean.js";


class DomTooltipObserver {
    /**
     *
     * @param {View} view
     * @param {function} factory
     */
    constructor(view, factory) {
        /**
         *
         * @type {View}
         */
        this.view = view;

        /**
         *
         * @type {Function}
         */
        this.factory = factory;

        const tipTargetRectangle = new Rectangle();
        /**
         *
         * @type {VisualTip}
         */
        this.tip = new VisualTip(tipTargetRectangle, factory);

        this.on = {
            entered: new Signal(),
            exited: new Signal()
        };

        let isEntered = this.isEntered = new ObservedBoolean(false);

        const self = this;

        function handleMouseEnter() {
            isEntered.set(true);

            self.on.entered.dispatch();

            sizeObserver.attach(view.el);
            sizeObserver.start();
        }

        function handleMouseLeave() {
            isEntered.set(false);

            sizeObserver.stop();

            self.on.exited.dispatch();

        }


        function dimensionsAreZero() {
            return tipTargetRectangle.position.isZero() && tipTargetRectangle.size.isZero();
        }

        function dimensionsAreFinite() {
            const p = tipTargetRectangle.position;
            const s = tipTargetRectangle.size;

            return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(s.x) && Number.isFinite(s.y);
        }


        const sizeObserver = new DomSizeObserver();


        function copyDimensionsFromBoundingRect() {
            const d = sizeObserver.dimensions;

            tipTargetRectangle.size.copy(d.size);
            tipTargetRectangle.position.copy(d.position);
        }

        function copyDimensions() {
            const position = view.position;
            const scale = view.scale;
            const size = view.size;

            tipTargetRectangle.position.set(position.x, position.y);
            tipTargetRectangle.size.set(size.x * scale.x, size.y * scale.y);

            if (dimensionsAreZero() && dimensionsAreFinite()) {
                requestAnimationFrame(copyDimensionsFromBoundingRect);
            }
        }

        const bindings = [
            new SignalBinding(view.position.onChanged, copyDimensions),
            new SignalBinding(view.size.onChanged, copyDimensions),
            new SignalBinding(sizeObserver.dimensions.position.onChanged, copyDimensionsFromBoundingRect),
            new SignalBinding(sizeObserver.dimensions.size.onChanged, copyDimensionsFromBoundingRect)
        ];

        this.handleViewLinked = function () {
            const el = view.el;

            //ensure that the element can capture pointer events
            el.style.pointerEvents = "auto";

            el.addEventListener(MouseEvents.Enter, handleMouseEnter);
            el.addEventListener(MouseEvents.Leave, handleMouseLeave);

            bindings.forEach(b => b.link());

            copyDimensions();
        };

        this.handleViewUnlinked = function () {
            const el = view.el;

            el.removeEventListener(MouseEvents.Enter, handleMouseEnter);
            el.removeEventListener(MouseEvents.Leave, handleMouseLeave);

            bindings.forEach(b => b.unlink());

            if (isEntered.getValue()) {
                //remove tip
                handleMouseLeave();
            }
        };

    }

    link() {
        const view = this.view;

        if (view.isLinked) {
            this.handleViewLinked();
        }

        view.on.linked.add(this.handleViewLinked);
        view.on.unlinked.add(this.handleViewUnlinked);

    }

    unlink() {
        const view = this.view;

        if (view.isLinked) {
            this.handleViewUnlinked();
        }

        view.on.linked.remove(this.handleViewLinked);
        view.on.unlinked.remove(this.handleViewUnlinked);
    }
}

/**
 *
 */
export class DomTooltipManager {
    /**
     *
     * @param {TooltipManager} tipManager
     */
    constructor(tipManager) {
        /**
         * @readonly
         * @private
         * @type {TooltipManager}
         */
        this.tipManager = tipManager;

        /**
         * @readonly
         * @private
         * @type {WeakMap<View, DomTooltipObserver>}
         */
        this.live = new WeakMap();
    }

    /**
     *
     * @returns {TooltipManager}
     */
    getTipManager() {
        return this.tipManager;
    }

    /**
     *
     * @param {DomTooltipObserver} observer
     */
    show(observer) {
        const tip = observer.tip;

        this.tipManager.add(tip);
    }

    /**
     *
     * @param {DomTooltipObserver} observer
     */
    hide(observer) {
        const tip = observer.tip;

        this.tipManager.remove(tip)
    }

    updatePositions() {
        const tipManager = this.tipManager;

        tipManager.tips.forEach(tip => {

            tipManager.positionTip(tip.view);

        });
    }

    /**
     * Update tooltip for a given view
     * @param {View} view
     * @returns {boolean}
     */
    updateTip(view) {
        const observer = this.live.get(view);

        if (observer === undefined) {
            //not live
            return false;
        }

        if (observer.isEntered.getValue()) {
            //re-draw
            this.hide(observer);
            this.show(observer);
        }
    }

    /**
     * Completely manage tooltip for a given view. Tooltip will be added and removed based on View's linked status
     * @param {View} view
     * @param {function} factory
     */
    manage(view, factory) {
        view.on.linked.add(() => {
            this.add(view, factory);
        });

        view.on.unlinked.add(() => {
            this.remove(view);
        });
    }

    /**
     * Added view will be automatically tracked and will continue on as long as the view exists or until it is
     * de-registered via "remove" method
     * @param {View} view View for which the tool tip will exist
     * @param {function} factory Tooltip factory function
     */
    add(view, factory) {
        const observer = new DomTooltipObserver(view, factory);

        this.live.set(view, observer);

        observer.on.entered.add(() => {
            this.show(observer);
        });

        observer.on.exited.add(() => {
            this.hide(observer);
        });


        observer.link();
    }

    /**
     *
     * @param {View} element
     */
    remove(element) {
        const observer = this.live.get(element);

        if (observer === undefined) {
            //observer not found for this element
            return;
        }

        //hide if shown
        this.hide(observer);

        //remove from the internal store
        this.live.delete(element);

        //unlink observer
        observer.unlink();
    }
}
