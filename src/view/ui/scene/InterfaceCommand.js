import { assert } from "../../../model/core/assert.js";

class InterfaceCommand {
    /**
     * @param {InteractionCommand} command
     * @param {object<string,*>} [style]
     * @param {string} tooltip
     * @constructor
     */
    constructor({ command, style = {}, tooltip }) {
        assert.notEqual(command, undefined, 'command is undefined');

        /**
         * @deprecated
         * @type {string}
         */
        this.id = command.id;
        /**
         * @deprecated
         * @type {ObservedBoolean}
         */
        this.enabled = command.enabled;
        /**
         * @deprecated
         * @type {List}
         */
        this.features = command.features;
        /**
         * @deprecated
         * @type {Function}
         */
        this.action = command.action;

        this.command = command;
        this.style = style;

        /**
         * Localization key for the tooltip
         * @type {string}
         */
        this.tooltip = tooltip;
    }
}

export default InterfaceCommand;
