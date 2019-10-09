import DatGuiController from "./DatGuiController.js";
import { clear } from "../../../ui/controller/dat/DatGuiUtils.js";
import ButtonView from "../../../ui/elements/button/ButtonView.js";
import { FogOfWarRevealer } from "../../../../model/level/fow/FogOfWarRevealer.js";

export class FogOfWarController extends DatGuiController {
    /**
     * @param {EntityManager} em
     * @constructor
     */
    constructor(em) {
        super();

        const self = this;

        this.addChild(new ButtonView({
            action() {
                /**
                 *
                 * @type {FogOfWar}
                 */
                const fow = self.model.getValue();

                fow.clear();

                //reveal things

                /**
                 *
                 * @type {FogOfWarRevealerSystem}
                 */
                const revealerSystem = em.getSystemByComponentClass(FogOfWarRevealer);

                if (revealerSystem !== undefined) {
                    revealerSystem.forceUpdate();
                }
            },
            name: 'Reset'
        }));

        /**
         *
         * @param {FogOfWar} model
         */
        function setModel(model) {
            const gui = self.gui;
            clear(gui);

            if (model !== null) {


            }
        }

        this.model.onChanged.add(setModel);
    }
}
