import { assert } from "../../../model/core/assert.js";

export class InteractionCommandSet {
    constructor() {
        this.commands = {};
    }

    /**
     *
     * @param {InteractionCommand} command
     */
    add(command) {
        if (this.getCommandById(command.id) !== undefined) {
            throw new Error(`Command with id='${command.id}' already exists`);
        }

        this.commands[command.id] = command;
    }

    /**
     *
     * @param {string} id
     * @returns {InteractionCommand}
     */
    getCommandById(id) {
        assert.typeOf(id, 'string', 'id');

        return this.commands[id];
    }
}