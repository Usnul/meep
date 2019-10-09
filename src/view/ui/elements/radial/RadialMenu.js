/**
 * Created by Alex on 26/07/2014.
 */


import RadialMenuElement from './RadialMenuElement';
import SVG from '../../../SVG';
import Vector2 from "../../../../model/core/geom/Vector2";
import EmptyView from '../EmptyView';

import View from "../../../View";

const PI2 = Math.PI * 2;

/**
 *
 * @param {number} outerRadius
 * @param {number} innerRadius
 * @param {number} centerX
 * @param {number} centerY
 * @returns {Element} SVG path element
 */
function makeDonut(outerRadius, innerRadius, centerX, centerY) {
    const el = SVG.createElement('path');
    const dValue = [
        `M ${centerX} ${centerY - outerRadius}`,
        `A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${centerY + outerRadius}`,
        `A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${centerY - outerRadius}`,
        'Z',
        `M ${centerX} ${centerY - innerRadius}`,
        `A ${innerRadius} ${innerRadius} 0 1 1 ${centerX} ${centerY + innerRadius}`,
        `A ${innerRadius} ${innerRadius} 0 1 1 ${centerX} ${centerY - innerRadius}`,
        'Z',
    ].join(' ');

    el.setAttribute('d', dValue);
    return el;
}

const DEFAULT_BACKGROUND_COLOR = 'rgba(0,0,0,0.15)';

class RadialMenu extends View {
    /**
     *
     * @param {Array} items
     * @param {number} [padding=0]
     * @param {number} [outerRadius=150]
     * @param {number} [innerRadius=50]
     * @param {string} [backgroundColor] CSSColor string
     * @param {string[]} [classList]
     * @constructor
     */
    constructor(items, {
        padding = 0,
        outerRadius = 150,
        innerRadius = 50,
        backgroundColor = DEFAULT_BACKGROUND_COLOR,
        classList = []
    }) {
        super();


        this.selected = [];

        /**
         *
         * @type {Array.<RadialMenuElement>}
         */
        this.elements = [];

        /**
         *
         * @type {number}
         */
        this.firstElementOffset = 0;

        /**
         *
         * @type {number}
         */
        this.padding = padding;

        /**
         *
         * @type {number}
         */
        this.outerRadius = outerRadius;
        /**
         *
         * @type {number}
         */
        this.innerRadius = innerRadius;
        /**
         *
         * @type {number}
         */
        this.radiusDelta = Math.abs(this.outerRadius - this.innerRadius);
        /**
         *
         * @type {number}
         */
        this.focusOuterRadius = this.outerRadius + this.radiusDelta * 0.2;
        /**
         *
         * @type {number}
         */
        this.focusInnerRadius = this.innerRadius;

        /**
         *
         * @type {number}
         */
        this.width = this.focusOuterRadius * 2;
        /**
         *
         * @type {number}
         */
        this.height = this.focusOuterRadius * 2;

        const el = this.el = document.createElement("div");
        el.classList.add('ui-radial-menu');
        classList.forEach(c => this.addClass(c));

        el.style.position = "absolute";
        el.style.overflow = "visible";

        this.size.set(this.width, this.height);

        const svgEl = SVG.createElement("svg");
        svgEl.style.overflow = "visible";
        svgEl.setAttribute("width", this.width);
        svgEl.setAttribute("height", this.height);

        //line to give feedback
        const elLine = SVG.createElement("line");
        elLine.classList.add("pointer-line");
        elLine.style.stroke = "rgba(255,255,255,0.6)";
        elLine.style.strokeWidth = "5";
        elLine.style.strokeLinecap = "round";

        el.appendChild(svgEl);

        const elDonut = makeDonut(this.focusOuterRadius, this.innerRadius, this.focusOuterRadius, this.focusOuterRadius);

        elDonut.setAttribute('fill', backgroundColor);
        svgEl.appendChild(elDonut);

        const vElementContainer = new EmptyView({ classList: ['elements'] });
        vElementContainer.position.set(this.focusOuterRadius, this.focusOuterRadius);
        this.addChild(vElementContainer);

        this.vElementContainer = vElementContainer;

        function moveLineEnd(x, y) {
            elLine.setAttribute("x2", vElementContainer.position.x + x);
            elLine.setAttribute("y2", vElementContainer.position.y + y);
        }

        this.linePosition = new Vector2(0, 0);
        this.linePosition.onChanged.add(moveLineEnd);

        elLine.setAttribute("x1", vElementContainer.position.x);
        elLine.setAttribute("y1", vElementContainer.position.y);

        //initialize line to 0 length in the middle
        moveLineEnd(0, 0);

        this.init(items);

        const vLineContainer = new EmptyView({ classList: ['pointer-line'] });
        const elSvgLine = SVG.createElement('svg');
        vLineContainer.el.appendChild(elSvgLine);
        elSvgLine.appendChild(elLine);
        this.addChild(vLineContainer);
    }

    render() {
        this.elements.forEach(function (el) {
            el.render();
        });
    }

    link() {
        super.link();
        this.render();
    }

    computeTotalShareValue() {
        return this.elements.reduce(function (prev, element) {
            return prev + element.share;
        }, 0);
    }

    /**
     *
     * @param items
     */
    init(items) {
        const self = this;

        const padding = items.length > 1 ? this.padding : 0;

        this.elements = items.map(function (options) {
            options.outerRadius = self.outerRadius;
            options.innerRadius = self.innerRadius;
            options.padding = padding;
            return new RadialMenuElement(options);
        });

        this.elements.forEach(function (element) {
            self.vElementContainer.addChild(element);
        });
    }

    autoLayout() {
        //normalize share values
        this.normalizeElementShares();
        this.updatePositions();
    }

    normalizeElementShares() {
        const shareValue = this.computeTotalShareValue();
        this.elements.forEach(function (element) {
            element.share /= shareValue;
        });
    }

    normalizeOffsetsSequentially() {
        const elements = this.elements;

        if (elements.length === 0) {
            return;
        }
        const firstElement = elements[0];
        let offset = this.firstElementOffset - firstElement.share;
        elements.forEach(function (element) {
            const share = element.share;
            element.offset = offset;
            offset += share;
        });
    }

    updatePositions() {
        this.normalizeOffsetsSequentially();
        //render
        this.elements.forEach(function (element, index) {
            element.render();
        });
    }

    setElementSelection(el, flag) {
        const selected = this.selected;
        const index = selected.indexOf(el);
        if (flag && index < 0) {
            selected.push(el);
            el.outerRadius = this.focusOuterRadius;
            el.innerRadius = this.focusInnerRadius;
        } else if (!flag && index >= 0) {
            selected.splice(index, 1);
            el.outerRadius = this.outerRadius;
            el.innerRadius = this.innerRadius;
        }
    }

    resetElementSelection() {
        const self = this;
        this.selected.slice().forEach(function (el) {
            self.setElementSelection(el, false);
        });
    }

    selectByAngle(angle) {
        const self = this;
        const na = 1 - angle / PI2;
        this.resetElementSelection();
        //pick element that fits the angle
        let somethingSelected = this.elements.some(function (el) {
            //normalize offset
            let no = el.offset;

            while (no < 0) {
                no += 1;
            }

            let s0 = no;
            let s1 = no + el.share;


            if ((s0 <= na && s1 > na) || (s1 > 1 && (s1 % 1) > na)) {
                self.setElementSelection(el, true);
                return true;
            } else {
                return false;
            }

        });
    }

    runSelected() {
        this.selected.forEach(function (el) {
            const action = el.action;
            if (action !== void 0) {
                action();
            }
        });
    }
}


export default RadialMenu;
