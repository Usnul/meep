import View from "../../View.js";
import { PortView } from "./PortView.js";
import EmptyView from "../../ui/elements/EmptyView.js";
import LabelView from "../../ui/common/LabelView.js";
import { DraggableAspect } from "../../../model/engine/ui/DraggableAspect.js";
import Vector2 from "../../../model/core/geom/Vector2.js";
import { noop } from "../../../model/core/function/Functions.js";
import { NodeParameterDataType } from "../../../model/core/model/node-graph/node/parameter/NodeParameterDataType.js";
import DatGuiController from "../ecs/components/DatGuiController.js";
import { PortDirection } from "../../../model/core/model/node-graph/node/PortDirection.js";

export class NodeView extends View {
    /**
     *
     * @param {NodeInstance} node
     * @param {NodeVisualData} visual
     * @param {NodeGraphVisualData} visualData
     * @param {boolean} enableDrag
     * @param {function(PortView, Port)} portCreationCallback
     */
    constructor({ node, visual, visualData, enableDrag = true, portCreationCallback = noop }) {
        super();

        /**
         *
         * @type {NodeInstance}
         */
        this.node = node;
        /**
         *
         * @type {NodeVisualData}
         */
        this.visual = visual;

        this.el = document.createElement('div');

        this.addClass('ui-node-view');

        const vPorts = new EmptyView({
            classList: ['ports']
        });

        const nodeDescription = node.description;
        const vName = new LabelView(nodeDescription.name, {
            classList: ['name']
        });

        const v2_origin = new Vector2();

        const self = this;

        if (enableDrag) {
            const draggableAspect = new DraggableAspect({
                el: this.el,
                dragStart() {
                    v2_origin.copy(visual.dimensions.position);
                },
                drag(position, origin) {
                    const p = position.clone();

                    p.sub(origin);

                    const scale = new Vector2(1, 1);

                    self.computeGlobalScale(scale);

                    p.divide(scale);

                    p.add(v2_origin);

                    visual.dimensions.position.copy(p);
                }
            });
            this.on.linked.add(draggableAspect.start, draggableAspect);
            this.on.unlinked.add(draggableAspect.stop, draggableAspect);
        }

        //create parameters

        const vParamContainer = new EmptyView({ classList: ['parameters-container'] });

        const vParams = new DatGuiController({ classList: ['parameters'] });
        vParamContainer.addChild(vParams);

        nodeDescription.parameters.forEach(param => {
            const id = param.id;

            const type = param.type;

            let controller = null;

            if (type === NodeParameterDataType.Number) {
                controller = vParams.addControl({ v: node.getParameterValue(id) }, 'v');
            } else if (type === NodeParameterDataType.String) {
                controller = vParams.addControl({ v: node.getParameterValue(id) }, 'v');
            } else if (type === NodeParameterDataType.Boolean) {
                controller = vParams.addControl({ v: node.getParameterValue(id) }, 'v');
            }

            controller.name(param.name);
            controller.onChange((v) => {
                node.setParameterValue(id, v);
            });
        });


        this.addChild(vParamContainer);

        this.addChild(vName);

        this.addChild(vPorts);

        nodeDescription.getPorts().forEach(port => {

            const portVisualData = visual.getPort(port.id);

            const portView = new PortView({ port, visual: portVisualData, visualData });

            portCreationCallback(portView, port);

            vPorts.addChild(portView);

        });

        this.setClass('has-inputs', nodeDescription.getPorts().some(p => p.direction === PortDirection.In));
        this.setClass('has-outputs', nodeDescription.getPorts().some(p => p.direction === PortDirection.Out));

        this.on.linked.add(this.update, this);
        this.bindSignal(visual.dimensions.position.onChanged, this.update, this);
        this.bindSignal(visual.dimensions.size.onChanged, this.update, this);
    }

    update() {
        this.position.copy(this.visual.dimensions.position);
        this.size.copy(this.visual.dimensions.size);
    }
}
