import View from "../../View";
import SVG from "../../SVG";

export class CompassArrowView extends View {
    constructor() {
        super();


        const elSVG = SVG.createElement('svg');

        const elDefs = SVG.createElement('defs');
        const elGradient = SVG.createElement('linearGradient');
        elGradient.setAttribute('id', 'gradient');

        elDefs.appendChild(elGradient);
        const elStop0 = SVG.createElement('stop');
        const elStop1 = SVG.createElement('stop');

        elStop0.setAttribute('offset', '50%');
        elStop1.setAttribute('offset', '100%');

        elStop0.classList.add('color-stop-0');
        elStop1.classList.add('color-stop-1');

        elGradient.appendChild(elStop0);
        elGradient.appendChild(elStop1);
        elSVG.appendChild(elDefs);

        const h = 28;
        const w = 24;

        elSVG.classList.add('compass');

        elSVG.setAttribute('width', h);
        elSVG.setAttribute('height', w);

        const elPolygon = SVG.createElement('polygon');

        const half_w = w / 2;
        elPolygon.setAttribute('points', `${h},${half_w} 0,${w} 0,0`);
        elPolygon.classList.add('compass-triangle');

        elSVG.appendChild(elPolygon);

        //set rotation origin to the bottom middle of the element
        const t = half_w * Math.SQRT2;

        elSVG.style.transformOrigin = `${t}px ${half_w}px`;
        elSVG.style.top = `-${half_w}px`;
        elSVG.style.left = `-${t}px`;

        this.el = elSVG;
    }

    rotateFromDirectionVector(x, y) {
        const angle = Math.atan2(y, x);

        this.rotation.set(angle);
    }
}




