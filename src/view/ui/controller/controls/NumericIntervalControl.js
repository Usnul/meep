import DatGuiController from "../../../editor/ecs/components/DatGuiController.js";

class NumericIntervalControl extends DatGuiController {
    constructor() {

        super();

        this.dRoot.addClass('numeric-interval-control');

        const surrogate = {
            min: 0,
            max: 0
        };

        const minController = this.addControl(surrogate, 'min').onChange(surrogate2model);
        const maxController = this.addControl(surrogate, 'max').onChange(surrogate2model);

        const precision = 5;

        minController.__precision = precision;
        maxController.__precision = precision;

        this.controllers = {
            min: minController,
            max: maxController
        };

        const self = this;

        let modelWriteLock = false;
        let controllerWriteLock = false;

        function surrogate2model() {
            controllerWriteLock = true;

            const interval = self.model.getValue();

            if (interval !== null && !modelWriteLock) {
                const min = surrogate.min;
                const max = surrogate.max;

                if (min > max) {
                    //invariant violated, fix
                    maxController.setValue(min);
                    interval.set(min, min);
                } else {
                    interval.set(min, max);
                }
            }

            controllerWriteLock = false;
        }

        function model2surrogate() {
            modelWriteLock = true;

            const interval = self.model.getValue();

            if (interval !== null && !controllerWriteLock) {
                surrogate.min = interval.min;
                surrogate.max = interval.max;

                minController.setValue(interval.min);
                maxController.setValue(interval.max);
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



export default NumericIntervalControl;