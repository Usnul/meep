/**
 * Created by Alex on 02/05/2016.
 */
import dom from '../../../DOM';
import SVG from '../../../SVG';
import View from "../../../View";
import { assert } from "../../../../model/core/assert.js";
import { computeIsoscelesTriangleApexAngle } from "../../../../model/core/math/MathUtils.js";
import { RadialText } from "./RadialText.js";

const PI2 = Math.PI * 2;

const elementPrototype = (function () {
    const svgElement = SVG.createElement("path");
    svgElement.setAttribute("fill", "rgba(255,0,0,0.5)");
    return svgElement;
})();

class RadialMenuElement extends View {
    /**
     *
     * @param {number} [share=1] Normalized share of the entire circle, 1 is full circle, 0.5 is half and so on
     * @param {function} [action]
     * @param {String|number} [fill] CSS color for the fill
     * @param {number} [offset=0] Normalized offset within the circle
     * @param {number} [padding]
     * @param {number} [innerRadius]
     * @param {number} [outerRadius]
     * @param {View} [iconView]
     * @param {number} [iconSize]
     * @param {boolean} [autoSizeIcon]
     * @param {String} [name]
     * @param {number} [nameRadiusOffset]
     * @param {String|number} [nameFill] CSS color for name label
     */
    constructor(
        {
            share = 1,
            action = null,
            fill = "none",
            offset = 0,
            padding = 0,
            innerRadius = 100,
            outerRadius = 150,
            iconView,
            iconSize = 20,
            autoSizeIcon = true,
            name = "",
            nameRadiusOffset = 10,
            nameFill = "black"
        }
    ) {
        super();

        assert.notEqual(iconView, undefined, "Icon View must be defined");
        assert.notEqual(iconView, null, "Icon View must not be null");

        assert.typeOf(share, 'number', 'share');
        assert.typeOf(offset, 'number', 'offset');
        assert.typeOf(padding, 'number', 'padding');
        assert.typeOf(innerRadius, 'number', 'innerRadius');
        assert.typeOf(outerRadius, 'number', 'outerRadius');
        assert.typeOf(iconSize, 'number', 'iconSize');
        assert.typeOf(autoSizeIcon, 'boolean', 'autoSizeIcon');

        const self = this;

        /**
         *
         * @type {number}
         */
        this.share = share;
        /**
         *
         * @type {Function}
         */
        this.action = action;
        /**
         *
         * @type {String|number}
         */
        this.fill = fill;
        /**
         *
         * @type {number}
         */
        this.offset = offset;
        /**
         *
         * @type {number}
         */
        this.padding = padding;
        /**
         *
         * @type {boolean}
         */
        this.autoSizeIcon = autoSizeIcon;

        /**
         *
         * @type {String}
         */
        this.name = name;

        /**
         *
         * @type {number}
         */
        this.nameRadiusOffset = nameRadiusOffset;

        let dRoot = dom().addClass('ui-radial-menu-element');

        this.el = dRoot.el;

        this.vIcon = iconView;

        const elSvg = SVG.createElement('svg');
        const elArc = SVG.createElement("g");
        const elPath = elementPrototype.cloneNode(true);

        this.elPath = elPath;
        elSvg.appendChild(elArc);
        elArc.appendChild(elPath);
        elPath.setAttribute("fill", this.fill);

        Object.defineProperties(this, {
            iconSize: {
                set: function (val) {
                    iconSize = val;
                    self.updateIcon();
                }, get: function () {
                    return iconSize;
                }
            },
            innerRadius: {
                set: function (val) {
                    innerRadius = val;
                    self.render();
                },
                get: function () {
                    return innerRadius;
                }
            },
            outerRadius: {
                set: function (val) {
                    outerRadius = val;
                    self.render();
                },
                get: function () {
                    return outerRadius;
                }
            }
        });


        dRoot.append(elSvg);

        if (autoSizeIcon === false) {
            iconView.size.set(iconSize, iconSize);
        }

        this.radialText = new RadialText({
            share,
            offset,
            fill: nameFill,
            radius: outerRadius + nameRadiusOffset
        });

        this.radialText.setText(name);

        this.addChild(this.radialText);
        this.addChild(iconView);
    }

    updateIcon() {

        const vIcon = this.vIcon;

        const outerRadius = this.outerRadius;
        const innerRadius = this.innerRadius;

        let iconSize;

        if (this.autoSizeIcon) {

            iconSize = (outerRadius - innerRadius) / Math.SQRT2;
            vIcon.size.set(iconSize, iconSize);

        } else {

            iconSize = Math.max(vIcon.size.x, vIcon.size.y);

        }

        const a0 = this.offset * PI2;
        const a1 = a0 + this.share * PI2;

        const aMid = (a1 + a0) / 2;

        const cm = Math.cos(aMid);
        const sm = Math.sin(aMid);

        const r = (innerRadius + outerRadius) / 2;

        const iconMidX = cm * r;
        const iconMidY = sm * r;

        const x = iconMidX - iconSize / 2;
        const y = iconMidY - iconSize / 2;


        vIcon.position.set(x, y);
    }

    render() {
        const padding = this.padding;

        const padding_2 = padding / 2;

        //compute padding angle for inner and outer arcs
        const outerRadius = this.outerRadius;
        const innerRadius = this.innerRadius;

        const outerArcPadding = computeIsoscelesTriangleApexAngle(outerRadius, padding_2);
        const innerArcPadding = computeIsoscelesTriangleApexAngle(innerRadius, padding_2);

        //compute wedge bounds of the element
        const a0 = this.offset * PI2;
        const a1 = a0 + this.share * PI2;

        //compute inner and outer arcs for rendered element
        const innerStart = a0 + innerArcPadding;
        const innerEnd = a1 - innerArcPadding;

        const outerStart = a0 + outerArcPadding;
        const outerEnd = a1 - outerArcPadding;

        //draw arc
        this.elPath.setAttribute("d", SVG.svgArc2(innerRadius, outerRadius, innerStart, innerEnd, outerStart, outerEnd));

        this.radialText.radius = outerRadius + this.nameRadiusOffset;
        this.radialText.share = this.share;
        this.radialText.offset = this.offset;
        this.radialText.render();


        //update icon position
        this.updateIcon();
    }
}


export default RadialMenuElement;
