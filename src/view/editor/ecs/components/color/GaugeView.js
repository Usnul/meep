import GuiControl from "../../../../ui/controller/controls/GuiControl.js";
import EmptyView from "../../../../ui/elements/EmptyView.js";
import LabelView from "../../../../ui/common/LabelView.js";
import { PointerDevice } from "../../../../../model/engine/input/devices/PointerDevice.js";
import { clamp } from "../../../../../model/core/math/MathUtils.js";
import { AutoCanvasView } from "../common/AutoCanvasView.js";

export class GaugeView extends GuiControl {
    /**
     *
     * @param {string} name
     * @param {function} draw
     * @param {string[]} classList
     * @constructor
     */
    constructor({ name, draw, classList = [] }) {
        super();

        this.el.classList.add('gauge-view');
        classList.forEach(c => this.addClass(c));

        const self = this;

        const vMark = new EmptyView();
        vMark.el.classList.add('mark-view');

        const c = new AutoCanvasView();

        c.draw = function (ctx, width, height) {

            const model = self.model.getValue();

            const value = model !== null ? model.x : 0;

            draw(ctx, value, self, width, height);
        };

        const vGauge = new EmptyView({ classList: ['gauge'] });
        vGauge.addChild(c);
        vGauge.addChild(vMark);

        const vName = new LabelView(name);
        this.addChild(vName);
        this.addChild(vGauge);

        function updateMark() {
            const model = self.model.getValue();

            const value = model !== null ? model.x : 0;

            vMark.el.style.left = `${value * 100}%`;
        }

        function update() {
            c.render();

            updateMark();
        }

        this.render = update;

        this.model.onChanged.add(function (color, oldColor) {
            update();

            if (color !== null) {
                color.onChanged.add(update);
            }

            if (oldColor !== null) {
                oldColor.onChanged.remove(update);
            }

        });


        function setValue(v) {
            const model = self.model.getValue();

            if (model === null) {
                return;
            }

            model.set(clamp(v, 0, 1));
        }

        function setValueFromMouseEvent(event) {

            const offsetX = event.offsetX;

            setValue(offsetX / c.el.width);

            update();
        }

        const pD = new PointerDevice(c.el);

        pD.start();

        pD.on.down.add(function (position, event) {
            setValueFromMouseEvent(event);
        });

        pD.on.drag.add(function (position, origin, previousPosition, mouseEvent) {
            setValueFromMouseEvent(mouseEvent);
        });
    }
}