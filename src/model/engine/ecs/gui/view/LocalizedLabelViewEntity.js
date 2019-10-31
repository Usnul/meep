import { ViewEntity } from "./ViewEntity.js";
import { LocalizedLabelView } from "../../../../../view/ui/common/LocalizedLabelView.js";

export class LocalizedLabelViewEntity extends ViewEntity {
    constructor() {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-localized-label-view');
    }

    initialize(parameters, entity, dataset, engine) {
        //assemble seed
        const seed = {};

        for (let paramName in parameters) {
            if (paramName.startsWith('seed.')) {
                const seedParamName = paramName.slice(5);

                seed[seedParamName] = parameters[paramName];
            }
        }

        const classList = [];

        const pCL = parameters.classList;
        if (pCL !== undefined) {
            if (typeof pCL === "string") {

                pCL.split(',').map(s => s.trim()).forEach(s => classList.push(s));

            } else {
                console.warn(`classList parameter must be a string, instead was ${typeof pCL}`);
            }
        }

        const gml = engine.gui.gml;

        this.addChild(new LocalizedLabelView({
            id: parameters.id,
            seed,
            classList,
            gml,
            localization: engine.localization
        }));
    }

    finalize() {
        this.removeAllChildren();
    }
}
