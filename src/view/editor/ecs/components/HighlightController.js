import DatGuiController from "./DatGuiController.js";
import { clear } from "../../../ui/controller/dat/DatGuiUtils.js";

class HighlightController extends DatGuiController {
    /**
     *
     * @constructor
     */
    constructor() {
        super();

        const self = this;


        /**
         *
         * @param {Highlight} model
         */
        function setModel(model) {
            const gui = self.gui;
            clear(gui);

            if (model !== null) {
                self.addControl(model, 'r').name('Red').min(0).max(1).step(0.01);
                self.addControl(model, 'g').name('Green').min(0).max(1).step(0.01);
                self.addControl(model, 'b').name('Blue').min(0).max(1).step(0.01);
                self.addControl(model, 'a').name('Alpha').min(0).max(1).step(0.01);
            }
        }

        this.model.onChanged.add(setModel);
    }
}



export default HighlightController;
