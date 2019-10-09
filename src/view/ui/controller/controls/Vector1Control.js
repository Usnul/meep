/**
 * Created by Alex on 14/01/2017.
 */


import dom from '../../../DOM';
import View from "../../../View.js";
import ObservedValue from "../../../../model/core/model/ObservedValue.js";
import { NumberController } from "../../../editor/ecs/components/common/NumberController.js";

class Vector1Control extends View {
    constructor({ tag = 'div' } = {}) {
        super();

        const self = this;

        const dRoot = dom(tag);
        this.el = dRoot.el;

        this.model = new ObservedValue(null);


        const cNumber = new NumberController();
        this.addChild(cNumber);


        let lockForward = false;

        function syncForward() {
            lockForward = true;

            /**
             *
             * @type {Vector1}
             */
            const vector1 = self.model.getValue();
            if (vector1 !== null) {
                cNumber.value.set(vector1.getValue());
            }

            lockForward = false;
        }

        function writeBack(v) {
            if (lockForward) {
                return;
            }

            /**
             *
             * @type {Vector1}
             */
            const vector1 = self.model.getValue();

            if (vector1 !== null) {

                vector1.set(v);

            }
        }

        /**
         *
         * @param {Vector1} v1
         */
        function subscribe(v1) {
            if (v1 === null) {
                //do nothing
                return;
            }
            syncForward();
            v1.onChanged.add(writeBack);
        }

        /**
         *
         * @param {Vector1} v1
         */
        function unsubscribe(v1) {
            if (v1 === null) {
                //do nothing
                return;
            }

            v1.onChanged.remove(writeBack);
        }

        function handleModelChange(newModel, oldModel) {
            unsubscribe(oldModel);
            subscribe(newModel);
        }

        this.bindSignal(this.model.onChanged, handleModelChange);
        this.bindSignal(cNumber.value.onChanged, writeBack);

        this.on.linked.add(() => subscribe(this.model.getValue()));
        this.on.unlinked.add(() => unsubscribe(this.model.getValue()));
    }
}


export default Vector1Control;
