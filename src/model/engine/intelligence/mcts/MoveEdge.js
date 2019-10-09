export class MoveEdge {
    /**
     *
     * @param {Function} move
     */
    constructor(move) {
        /**
         * Move that leads from source state to the target state
         * @type {Function}
         */
        this.move = move;
        /**
         *
         * @type {null|StateNode}
         */
        this.target = null;
    }

    /**
     *
     * @returns {boolean}
     */
    isTargetMaterialized() {
        return this.target !== null;
    }
}