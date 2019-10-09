import View from "../../View";
import dom from "../../DOM";

import BoundedValue from "../../../model/core/model/BoundedValue";
import { frameThrottle } from "../../../model/graphics/FrameThrottle";
import { passThrough } from "../../../model/core/function/Functions.js";

function makeTextPercentage(value, max, process) {
    const r = (value / max) * 100;
    const x = process(r);
    return `${x}%`;
}

function makeTextAbsolute(value, max, process) {
    return process(value) + " / " + process(max);
}

class ProgressBarView extends View {
    constructor(model, {
        classList = [],
        displayLabel = false,
        displayLabelType = 'percent',
        process = passThrough
    } = {}) {

        super(model, classList, displayLabel, displayLabelType, process);

        const dRoot = dom().addClass('progress-bar');

        classList.forEach((className) => dRoot.addClass(className));

        this.el = dRoot.el;

        const fillElement = dRoot.createChild().addClass('fill').el;
        this.el.appendChild(fillElement);

        let dLabel = null;

        if (displayLabel === true) {
            dLabel = dom(this.el).createChild('div').addClass('label').css({ height: "inherit" });
        }

        let value = 0, max = 0;

        function render() {
            const style = fillElement.style;
            //sanitize input to be in range 0 to 1
            const fill = Math.min(1, Math.max(0, value / max));
            style.width = (fill * 100) + "%";

            if (dLabel !== null) {
                //update label text
                if (displayLabelType === "absolute") {
                    dLabel.text(makeTextAbsolute(value, max, process));
                } else {
                    dLabel.text(makeTextPercentage(value, max, process));
                }
            }
        }

        const throttledRender = frameThrottle(render);

        Object.defineProperties(this, {
            value: {
                get: function () {
                    return value;
                },
                set: function (val) {
                    if (value !== val) {
                        value = val;
                        throttledRender();
                    }
                }
            },
            max: {
                get: function () {
                    return max;
                },
                set: function (val) {
                    if (max !== val) {
                        max = val;
                        throttledRender();
                    }
                }
            }
        });

        if (model instanceof BoundedValue) {
            const view = this;

            function updateFromBoundedValue() {
                view.value = model.getValue();
                view.max = model.getUpperLimit();
            }

            updateFromBoundedValue();

            this.bindSignal(model.on.changed, updateFromBoundedValue);

        } else if (model instanceof Array) {
            const view = this;

            function update() {
                view.value = model[0].getValue();
                view.max = model[1].getValue();
            }

            update();

            model.forEach(function (m) {
                view.bindSignal(m.onChanged, update);
            });
        }
    }
}


export default ProgressBarView;
