/**
 * Created by Alex on 23/06/2016.
 */


import View from "../../View";
import dom from "../../DOM";
import ListView from '../../../view/ui/common/ListView';
import ButtonView from "../elements/button/ButtonView.js";
import domify from "../../DOM.js";
import { LanguageSelectorView } from "./LanguageSelectorView.js";
import { GameAssetType } from "../../../model/engine/asset/GameAssetType.js";

function createTitle() {

    const dTitle = domify().addClass('title');

    const dTitleLabel = dTitle.createChild();

    dTitleLabel.addClass('label');

    dTitleLabel.text("Might is Right");


    const dBackground = dTitle.createChild();

    dBackground.addClass('background');

    const dDecor = dTitle.createChild();

    dDecor.addClass('decoration');

    return dTitle;
}

class MainMenuView extends View {
    /**
     *
     * @param actions
     * @param {Engine} engine
     * @constructor
     */
    constructor({
                    actions,
                    engine
                }) {
        super(actions, engine);
        this.model = actions;

        const dRoot = dom('div').addClass('main-menu');
        this.el = dRoot.el;

        const dTitle = createTitle();
        dRoot.append(dTitle);


        let vActions = new ListView(actions, {
            elementFactory: function (action) {
                return new ButtonView({
                    name: action.name,
                    action: action.action,
                    classList: ['ui-button-rectangular']
                });
            },
            classList: ['command-container']
        });

        engine.assetManager.promise('data/database/text/languages.json', GameAssetType.JSON).then((asset) => {
            const json = asset.create();


            const selectorView = new LanguageSelectorView({
                languages: json,
                localization: engine.localization
            });

            this.addChild(selectorView);
        });

        this.addChild(vActions);
    }
}



export default MainMenuView;
