/**
 * Created by Alex on 14/01/2017.
 */
import DatGuiController from "../../../editor/ecs/components/DatGuiController.js";

class Vector3Control extends DatGuiController {
    constructor() {
        super();
        this.dRoot.addClass('vector3-control');

        const surrogate = {
            x: 0,
            y: 0,
            z: 0
        };

        const xController = this.addControl(surrogate, 'x').onChange(surrogate2model);
        const yController = this.addControl(surrogate, 'y').onChange(surrogate2model);
        const zController = this.addControl(surrogate, 'z').onChange(surrogate2model);

        const precision = 5;

        xController.__precision = precision;
        yController.__precision = precision;
        zController.__precision = precision;

        this.controllers = {
            x: xController,
            y: yController,
            z: zController
        };

        const self = this;

        let modelWriteLock = false;
        let controllerWriteLock = false;

        function surrogate2model() {
            controllerWriteLock = true;

            const v3 = self.model.getValue();

            if (v3 !== null && !modelWriteLock) {
                const sX = surrogate.x;
                const sY = surrogate.y;
                const sZ = surrogate.z;

                v3.set(sX, sY, sZ);
            }

            controllerWriteLock = false;
        }

        function model2surrogate() {
            modelWriteLock = true;

            const v3 = self.model.getValue();

            if (v3 !== null && !controllerWriteLock) {
                surrogate.x = v3.x;
                surrogate.y = v3.y;
                surrogate.z = v3.z;

                xController.setValue(v3.x);
                yController.setValue(v3.y);
                zController.setValue(v3.z);
            }

            modelWriteLock = false;
        }

        function modelChanged(modelNew, modelOld) {
            if (modelNew !== null) {
                model2surrogate();
                self.bindSignal(modelNew.onChanged, model2surrogate);
            }
            if (modelOld !== null && modelOld !== undefined) {
                self.unbindSignal(modelOld.onChanged, model2surrogate);
            }
        }

        this.on.linked.add(function () {
            model2surrogate();
        });

        this.model.process(modelChanged);
    }
}




export default Vector3Control;