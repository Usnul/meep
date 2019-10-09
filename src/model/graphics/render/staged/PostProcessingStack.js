import List from "../../../core/collection/List.js";

export class PostProcessingStack {
    constructor() {
        /**
         *
         * @type {List<RenderProgramInstance>}
         */
        this.effects = new List();
    }

    /**
     *
     * @return {Set<string>}
     */
    getRequiredBuffers() {
        const result = new Set();

        this.effects.forEach(e => {
            e.getRequiredBuffers().forEach(b => result.add(b));
        });

        return result;
    }

    isEmpty() {
        this.effects.isEmpty();
    }
}