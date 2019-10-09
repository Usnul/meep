import View from "../../../../View.js";
import LabelView from "../../../../ui/common/LabelView.js";
import { NumberController } from "./NumberController.js";
import { max2, min2 } from "../../../../../model/core/math/MathUtils.js";

export class NumericIntervalController extends View {
    /**
     *
     * @param {NumericInterval} interval
     * @param {string} tag
     */
    constructor({ interval, tag = 'div' }) {
        super();

        this.el = document.createElement(tag);
        this.addClass('ui-numeric-interval-controller');

        const vMin = new NumberController({ classList: ['min'] });
        const vMax = new NumberController({ classList: ['max'] });

        this.addChild(vMin);

        this.addChild(new LabelView('-', { classList: ['separator'], tag: 'span' }));

        this.addChild(vMax);

        let lockForward = false;

        function syncForward() {

            lockForward = true;

            vMin.value.set(interval.min);
            vMax.value.set(interval.max);

            lockForward = false;
        }

        this.on.linked.add(syncForward);

        this.bindSignal(interval.onChanged, syncForward);

        this.bindSignal(vMin.value.onChanged, (v) => {
            if (lockForward) {
                return;
            }

            const max = max2(v, vMax.value.getValue());

            interval.set(v, max)
        });

        this.bindSignal(vMax.value.onChanged, (v) => {
            if (lockForward) {
                return;
            }

            const min = min2(v, vMin.value.getValue());

            interval.set(min, v)
        });
    }
}