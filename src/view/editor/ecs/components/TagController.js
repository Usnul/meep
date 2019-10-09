import DatGuiController from "./DatGuiController.js";
import { clear } from "../../../ui/controller/dat/DatGuiUtils.js";

export class TagController extends DatGuiController {
    constructor() {
        super();

        const self = this;


        /**
         *
         * @param {Tag} model
         */
        function setModel(model) {
            const gui = self.gui;
            clear(gui);


            if (model !== null) {

                if (model.name === undefined) {
                    model.name = '';
                }

                self.addControl(model, 'name').name('Name');
            }
        }

        this.model.onChanged.add(setModel);
    }
}