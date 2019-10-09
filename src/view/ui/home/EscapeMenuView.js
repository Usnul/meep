import EmptyView from "../elements/EmptyView.js";
import ButtonView from "../elements/button/ButtonView.js";
import { LocalizedLabelView } from "../common/LocalizedLabelView.js";
import ListView from "../common/ListView.js";
import List from "../../../model/core/collection/List.js";
import { assert } from "../../../model/core/assert.js";

export class EscapeMenuView extends EmptyView {
    /**
     *
     * @param {Localization} localization
     * @param {Engine} engine
     */
    constructor({ localization, engine }) {
        super();

        assert.notEqual(engine, undefined, 'engine is undefined');

        this.addClass('ui-escape-menu-view');

        const options = new List();

        this.addChild(new ListView(options, {
            classList: [
                'option-container'
            ],
            elementFactory({ action, id }) {

                const button = new ButtonView({
                    action,
                    classList: [
                        'ui-button-rectangular'
                    ]
                });

                button.addChild(new LocalizedLabelView({
                    id,
                    localization
                }));

                return button;
            }
        }));

        options.add({
            id: "system_escape_menu_return_to_main_menu",
            action() {
                engine.sceneManager.stackPush('title');
            }
        });

        options.add({
            id: "system_main_menu_exit",
            action() {
                engine.requestExit();
            }
        });
    }
}
