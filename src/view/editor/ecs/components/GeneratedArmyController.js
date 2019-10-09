import DatGuiController from "./DatGuiController.js";
import { clear } from "../../../ui/controller/dat/DatGuiUtils.js";
import { buildCombatUnitsValidator, extractFunctionBody } from "../../../../model/game/ecs/component/GeneratedArmy.js";

export class GeneratedArmyController extends DatGuiController {
    /**
     *
     * @constructor
     */
    constructor() {
        super();

        const self = this;

        const proxy = {
            validator: ''
        };


        /**
         *
         * @param {GeneratedArmy} model
         */
        function setModel(model) {
            const gui = self.gui;
            clear(gui);

            if (model !== null) {
                proxy.validator = extractFunctionBody(model.validator);

                self.addControl(model, 'value').name('Value');
                self.addControl(proxy, 'validator').name('Validator').onChange(function () {
                    model.validator = buildCombatUnitsValidator(proxy.validator);
                });
            }
        }

        this.model.onChanged.add(setModel);
    }
}
