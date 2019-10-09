import View from "../../../View.js";
import SVG, { svgCircularPath } from "../../../SVG.js";
import { isValueBetween, PI2 } from "../../../../model/core/math/MathUtils.js";
import { assert } from "../../../../model/core/assert.js";

let idCount = 0;

function generateCurveId() {
    const r = `radial-text-curve${idCount}`;

    idCount++;

    return r;
}

let idShadowFilter = 0;

/**
 * NOTE: adapted from https://www.w3.org/People/Dean/svg/texteffects/shadow.svg
 * @param {number} dx
 * @param {number} dy
 * @param {number} blurX
 * @param {number} blurY
 * @returns {{el: Element, id: string}}
 */
function createShadowFilter(dx, dy, blurX, blurY) {
    const filter = SVG.createElement('filter');

    const id = `drop-shadow-filter-${idShadowFilter++}`;
    filter.setAttribute('id', id);
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');

    const feGaussianBlur = SVG.createElement('feGaussianBlur');

    feGaussianBlur.setAttribute('stdDeviation', `${blurX} ${blurY}`);
    feGaussianBlur.setAttribute('result', 'shadow');

    filter.appendChild(feGaussianBlur);

    if (dx !== 0 || dy !== 0) {
        const feOffset = SVG.createElement('feOffset');

        filter.appendChild(feOffset);
    }

    return {
        el: filter,
        id
    };
}


export class RadialText extends View {
    /**
     *
     * @param {number} share
     * @param {number} offset
     * @param {number} radius
     * @param {String|number} [fill] CSS color for the text
     * @param {boolean} [useShadow=true]
     */
    constructor({ share = 1, offset = 0, radius = 100, fill = 'black', useShadow = true } = {}) {
        super();

        assert.typeOf(share, "number", "share");
        assert.typeOf(offset, "number", "offset");
        assert.typeOf(radius, "number", "radius");

        this.share = share;
        this.offset = offset;
        this.radius = radius;

        /**
         * When text is flipped, this is added to the radius to move text further away from origin
         * NOTE: this is a fudge factor and need to be adjusted in tandem with font size
         * @type {number}
         */
        this.flipAlignmentOffset = 20;

        /**
         * Setting this to true will automatically toggle flipY on and off based on the angle at which the text appears
         * @type {boolean}
         */
        this.autoFlipY = true;

        /**
         * Text will be flipped up-side-down if set to true. If {@link #autoFlipY} is set to true, this parameter will be ignored and overridden
         * @type {boolean}
         */
        this.flipY = false;

        /**
         * @readonly
         * @type {boolean}
         */
        this.useShadow = useShadow;

        const elSVG = SVG.createElement('svg');
        elSVG.classList.add('radial-text-label');

        const elPath = SVG.createElement('path');

        const elText = SVG.createElement('text');

        const elTextPath = SVG.createElement('textPath');

        /**
         * NOTE: A unique curve ID is required as Chrome seems to pick up curves from other elements if IDs match
         * @type {string}
         */
        const curveId = generateCurveId();

        //
        elPath.setAttribute("id", curveId);

        elTextPath.setAttribute("startOffset", "50%");
        elTextPath.setAttribute("text-anchor", "middle");
        elTextPath.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "#" + curveId);


        //assemble
        const elements = {
            path: elPath,
            textPath: elTextPath
        };

        this.elements = elements;

        if (useShadow) {
            const shadowFilter = createShadowFilter(0, 0, 4, 4);
            const elDefs = SVG.createElement('defs');

            elSVG.appendChild(elDefs);
            elDefs.appendChild(shadowFilter.el);

            const elShadowText = SVG.createElement('textPath');
            elShadowText.setAttribute("startOffset", "50%");
            elShadowText.setAttribute("text-anchor", "middle");
            elShadowText.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "#" + curveId);


            elShadowText.style.filter = `url(#${shadowFilter.id})`;

            elText.appendChild(elShadowText);

            elements.shadow = {
                textPath: elShadowText
            };
        }

        elText.appendChild(elTextPath);

        elSVG.appendChild(elPath);
        elSVG.appendChild(elText);

        this.el = elSVG;


        this.setFill(fill);
    }

    /**
     *
     * @param {String|number} color
     */
    setFill(color) {
        this.elements.textPath.setAttribute('fill', color);
    }

    /**
     *
     * @param {String} value
     */
    setText(value) {
        //set text value
        this.elements.textPath.textContent = value;

        if (this.useShadow) {
            this.elements.shadow.textPath.textContent = value;
        }
    }

    render() {
        const offset = this.offset;
        const share = this.share;
        let radius = this.radius;

        if (this.autoFlipY) {
            //find mid point of the arch
            let midPoint = offset + share / 2;

            if (midPoint < 0) {
                midPoint++;
            }

            this.flipY = isValueBetween(midPoint % 1, 0, 0.5);
        }


        let a0 = offset * PI2;
        let a1 = (offset + share) * PI2;


        let angle0, angle1;

        if (this.flipY) {
            angle0 = a1;
            angle1 = a0;

            //push the text off-center along the radius
            radius = radius + this.flipAlignmentOffset;
        } else {
            angle0 = a0;
            angle1 = a1;
        }

        const d = svgCircularPath(
            radius,
            angle0,
            angle1
        );

        // const d = "M6,150C49.63,93,105.79,36.65,156.2,47.55,207.89,58.74,213,131.91,264,150c40.67,14.43,108.57-6.91,229-145";
        this.elements.path.setAttribute("d", d);

    }
}
