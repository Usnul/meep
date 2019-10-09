/**
 * Created by Alex on 13/12/2016.
 */


import View from "../../../View";
import SVG from '../../../SVG';

import ObservedValue from "../../../../model/core/model/ObservedValue";
import BoundedValue from "../../../../model/core/model/BoundedValue";
import { clamp } from "../../../../model/core/math/MathUtils.js";

class RadialProgressView extends View {
    constructor(model, options) {
        super(model, options);
        const self = this;

        const svgEl = SVG.createElement('svg');
        svgEl.classList.add('radial-progress-view');
        svgEl.style.overflow = "visible";

        this.thickness = new ObservedValue(options.thickness);


        const elG = SVG.createElement('g');
        svgEl.appendChild(elG);

        const offsetAngle = -90;

        function computeRadius() {
            return Math.min(self.size.x, self.size.y) / 2;
        }

        function updateCentering() {
            const r = computeRadius();
            elG.setAttribute("transform", "translate(" + r + "," + r + ") rotate(" + offsetAngle + ")");
        }

        updateCentering();
        const elArc = SVG.createElement('path');
        elArc.setAttribute("fill", options.fill);
        elG.appendChild(elArc);

        function update(value, limit) {
            if (limit === 0) {
                limit = value;
            }

            const n0 = clamp(value / limit, 0, 1);

            const a0 = 0;
            const a1 = n0 * Math.PI * 2;

            const r1 = computeRadius();
            const r0 = r1 - self.thickness.get();
            elArc.setAttribute("d", SVG.arcPath(r0, r1, a0, a1));
        }

        let redraw;
        if (model instanceof BoundedValue) {
            redraw = function () {
                update(model.getValue(), model.getUpperLimit());
            };
            model.on.changed.add(update);
        } else if (model instanceof Array) {
            redraw = function () {
                update(model[0].getValue(), model[1].getValue());
            };
            model[0].onChanged.add(redraw);
            model[1].onChanged.add(redraw);
        } else {
            throw new Error("Unsupported model type: " + model);
        }


        this.el = svgEl;

        this.thickness.onChanged.add(function () {
            redraw();
        });
        this.size.onChanged.add(function (x, y) {

            svgEl.setAttribute("width", x);
            svgEl.setAttribute("height", y);

            updateCentering();
            redraw();
        });
    }
};


export default RadialProgressView;

