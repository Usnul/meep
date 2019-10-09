import View from "../../View.js";
import dom from "../../DOM.js";
import ListView from "../common/ListView.js";
import ButtonView from "../elements/button/ButtonView.js";

class SecondaryMenuView extends View {
    /**
     *
     * @param {List} model
     * @param options
     * @constructor
     */
    constructor(model, options) {
        super(model, options);
        this.model = model;

        const dRoot = dom('div').addClass('secondary-menu');
        this.el = dRoot.el;


        //add decor
        const dDecor = dRoot.createChild();
        dDecor.addClass('decoration');

        //add background
        const dBackground = dRoot.createChild();
        dBackground.addClass('background');

        //add content
        const vActions = new ListView(model, {
            elementFactory: function ({name, action, icon}) {
                const buttonView = new ButtonView({
                    name: name,
                    action: action,
                    icon
                });
                return buttonView;
            },
            classList: ['command-container']
        });

        this.addChild(vActions);
    }
}



export default SecondaryMenuView;
