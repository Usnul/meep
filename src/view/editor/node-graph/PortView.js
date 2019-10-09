import View from "../../View.js";
import { objectKeyByValue } from "../../../model/core/model/ObjectUtils.js";
import { PortDirection } from "../../../model/core/model/node-graph/node/PortDirection.js";
import { camelToKebab } from "../../../model/core/strings/StringUtils.js";
import LabelView from "../../ui/common/LabelView.js";
import EmptyView from "../../ui/elements/EmptyView.js";

export class PortView extends View {
    /**
     *
     * @param {Port} port
     * @param {PortVisualData} visual
     * @param {NodeGraphVisualData} visualData
     */
    constructor({ port, visual, visualData }) {
        super();

        /**
         *
         * @type {Port}
         */
        this.port = port;
        /**
         *
         * @type {PortVisualData}
         */
        this.visual = visual;

        this.el = document.createElement('div');

        this.addClass('ui-port-view');

        this.addClass(`direction-${objectKeyByValue(PortDirection, port.direction).toLocaleLowerCase()}`);

        this.addClass(`data-type-${camelToKebab(port.dataType.name)}`);

        //add port name label
        const vName = new LabelView(port.name, {
            classList: ['name']
        });

        this.addChild(vName);

        const color = visualData.getDataColor(port.dataType.id);

        this.addChild(new EmptyView({
            classList: ['marker'],
            css: {
                backgroundColor: `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`
            }
        }));

        this.on.linked.add(this.update, this);
        this.bindSignal(visual.position.onChanged, this.update, this);
    }

    update() {
        this.position.copy(this.visual.position);
    }
}
