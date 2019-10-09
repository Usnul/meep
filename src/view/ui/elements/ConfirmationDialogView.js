/**
 * Created by Alex on 07/09/2016.
 */


import View from "../../View";
import dom from "../../DOM";
import ButtonView from "./button/ButtonView.js";
import EmptyView from "./EmptyView.js";

/**
 * @typedef {Object} ConfirmationDialogView~Option
 * @property {string} name
 * @property {string} displayName
 * @property {function} callback
 */

class ConfirmationDialogView extends View {
    /**
     * @param {View} content
     * @param {Array.<ConfirmationDialogView~Option>} options
     * @constructor
     */
    constructor(content, options) {
        super(content, options);

        const dRoot = dom("div").addClass("ui-confirmation-dialog-view");

        this.el = dRoot.el;

        const vContentContainer = new EmptyView({ classList: ['content-container'] });
        vContentContainer.addChild(content);
        this.addChild(vContentContainer);

        const vButtonArea = new EmptyView({ classList: ['button-area'] });

        for (let i = 0; i < options.length; i++) {
            const option = options[i];

            const className = "button-" + option.name.replace(' ', '-');

            const name = option.displayName;

            const vButton = new ButtonView({
                name,
                action: function (event) {
                    event.stopPropagation();
                    option.callback(event);
                },
                classList: [className, "ui-confirmation-dialog-button", 'ui-button-rectangular']
            });

            vButton.size.set(115, 36);

            vButtonArea.addChild(vButton);
        }

        this.addChild(vButtonArea);
    }
}


export default ConfirmationDialogView;
