import LabelView from "../../../ui/common/LabelView.js";
import Vector1Control from "../../../ui/controller/controls/Vector1Control.js";
import ObservedValue from "../../../../model/core/model/ObservedValue.js";
import { LineView } from "./common/LineView.js";
import View from "../../../View.js";
import { BooleanVector3Control } from "../../../ui/controller/controls/BooleanVector3Control.js";

export class PathFollowerController extends View {
    constructor() {
        super();


        this.el = document.createElement('div');
        this.addClass('ui-path-follower-controller');

        this.model = new ObservedValue(null);

        const cRotationSpeed = new Vector1Control();

        this.addChild(new LineView({
            elements: [
                new LabelView('rotation speed'),
                cRotationSpeed
            ]
        }));

        const cSpeed = new Vector1Control();
        this.addChild(new LineView({
            elements: [
                new LabelView('speed'),
                cSpeed
            ]
        }));

        const cRotationAlignment = new BooleanVector3Control();

        this.addChild(new LineView({
            elements: [
                new LabelView('rotation alignment'),
                cRotationAlignment
            ]
        }));


        /**
         *
         * @param {PathFollower} model
         */
        function setModel(model) {

            if (model !== null) {
                cRotationSpeed.model.set(model.rotationSpeed);
                cSpeed.model.set(model.speed);
                cRotationAlignment.model.set(model.rotationAlignment);
            }
        }

        this.model.onChanged.add(setModel);
    }
}
