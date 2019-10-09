export class ResourceAllocation {
    /**
     *
     * @param {Resource[]} [resources=[]]]
     */
    constructor(resources = []) {
        /**
         * Resource set being bid on
         * @type {Resource[]}
         */
        this.resources = resources;
    }
}