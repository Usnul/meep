import View from "../../../View.js";
import { CheckboxView } from "../../elements/CheckboxView.js";
import ObservedBoolean from "../../../../model/core/model/ObservedBoolean.js";
import { LineView } from "../../../editor/ecs/components/common/LineView.js";
import LabelView from "../../common/LabelView.js";
import ObservedValue from "../../../../model/core/model/ObservedValue.js";

export class BooleanVector3Control extends View {
    constructor() {
        super();

        this.el = document.createElement('div');
        this.addClass('ui-boolean-vector3-controller');

        this.model = new ObservedValue(null);

        const _x = new ObservedBoolean(false);
        const _y = new ObservedBoolean(false);
        const _z = new ObservedBoolean(false);

        _x.onChanged.add(v => {
            const b = this.model.getValue();
            if (b !== null) {
                b.setX(v);
            }
        });

        _y.onChanged.add(v => {
            const b = this.model.getValue();
            if (b !== null) {
                b.setY(v);
            }
        });

        _z.onChanged.add(v => {
            const b = this.model.getValue();
            if (b !== null) {
                b.setZ(v);
            }
        });

        const cX = new CheckboxView({ value: _x });
        const cY = new CheckboxView({ value: _y });
        const cZ = new CheckboxView({ value: _z });

        this.addChild(new LineView({
            elements: [
                new LabelView('x'),
                cX,
                new LabelView('y'),
                cY,
                new LabelView('z'),
                cZ
            ]
        }));


        function setValues(x, y, z) {
            _x.set(x);
            _y.set(y);
            _z.set(z);
        }

        this.model.onChanged.add((model, oldModel) => {

            if (model !== null) {
                setValues(model.x, model.y, model.z);
                model.onChanged.add(setValues);
            }

            if (oldModel !== null) {
                oldModel.onChanged.remove(setValues);
            }

        });
    }
}
