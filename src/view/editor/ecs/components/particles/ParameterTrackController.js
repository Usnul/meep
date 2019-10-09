import GuiControl from "../../../../ui/controller/controls/GuiControl.js";
import LabelView from "../../../../ui/common/LabelView.js";
import { ColorParameterLUTController } from "./ColorParameterLUTController.js";
import { ScalarParameterLUTController } from "./ScalarParameterLUTController.js";
import { ParticleParameters } from "../../../../../model/graphics/particles/particular/engine/emitter/ParticleParameters.js";
import ObservedString from "../../../../../model/core/model/ObservedString.js";

export class ParameterTrackController extends GuiControl {
    constructor() {
        super();

        const self = this;

        const trackName = new ObservedString("");

        const lName = new LabelView(trackName);

        let cLUT = null;

        this.addChild(lName);

        this.model.onChanged.add(function (track) {
            if (cLUT !== null) {
                self.removeChild(cLUT);
                cLUT = null;
            }

            if (track === null) {
                trackName.set("");
            } else {
                const name = track.name;

                trackName.set(name);

                if (name === ParticleParameters.Color) {
                    cLUT = new ColorParameterLUTController();
                } else if (name === ParticleParameters.Scale) {
                    cLUT = new ScalarParameterLUTController();
                } else {
                    throw new Error(`Unsupported type '${type}'`);
                }

                cLUT.model.set(track.track);

                self.addChild(cLUT);
            }
        });
    }
}