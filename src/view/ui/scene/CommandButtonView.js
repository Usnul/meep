import View from "../../View";
import dom from "../../DOM";
import { globalMetrics } from "../../../model/engine/metrics/GlobalMetrics.js";
import { MetricsCategory } from "../../../model/engine/metrics/MetricsCategory.js";

class CommandButtonView extends View {
    /**
     *
     * @param {InterfaceCommand} prop
     * @param {GUIEngine} gui
     * @constructor
     * @extends {View}
     */
    constructor(prop, gui) {
        super();

        /**
         *
         * @type {InteractionCommand}
         */
        const command = prop.command;

        const dButton = dom('button').css(prop.style).addClass('command-button-view');
        dButton.addClass('command-' + prop.id);

        this.el = dButton.el;


        dButton.el.onclick = function () {
            if (command.enabled.getValue()) {
                command.action();

                globalMetrics.record("command-used", {
                    category: MetricsCategory.Interaction,
                    label: prop.command.id
                });
            }
        };

        dButton.createChild('div').addClass('background');
        dButton.createChild('div').addClass('foreground');

        function updateEnableStatus() {
            const v = command.enabled.getValue();

            dButton.disabled = !v;
            dButton.setClass('disabled', !v);
            dButton.setClass('enabled', v);
        }

        function featureClassName(f) {
            return "feature-" + f;
        }

        function addCommandFeature(f) {
            dButton.addClass(featureClassName(f));
        }

        function removeCommandFeature(f) {
            dButton.removeClass(featureClassName(f));
        }

        if (command.features !== undefined) {
            command.features.forEach(addCommandFeature);
            command.features.on.added.add(addCommandFeature);
            command.features.on.removed.add(removeCommandFeature);
        }

        this.bindSignal(command.enabled.onChanged, updateEnableStatus);
        this.bindSignal(command.features.on.added, addCommandFeature);
        this.bindSignal(command.features.on.removed, removeCommandFeature);

        const tooltip = prop.tooltip;

        function tooltipFactory() {
            return gui.localization.getString(tooltip);
        }

        if (tooltip !== undefined) {
            gui.viewTooltips.manage(this, tooltipFactory);
        }

        this.on.linked.add(() => {
            command.features.forEach(addCommandFeature);
            updateEnableStatus();
        });

        this.on.unlinked.add(() => {
            command.features.forEach(removeCommandFeature);
        });
    }
}


export default CommandButtonView;
