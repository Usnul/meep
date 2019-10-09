import { ResourceAllocationSolver } from "./ResourceAllocationSolver.js";
import { assert } from "../../../core/assert.js";

export class StrategicResourceAllocator {
    constructor() {
        /**
         *
         * @type {TacticalModule[]}
         */
        this.modules = [];
    }

    /**
     *
     * @param {TacticalModule} module
     */
    addTacticalModule(module) {
        this.modules.push(module);
    }

    /**
     * @template A
     * @param {Resource[]} resources
     * @returns {Promise<A[]>} actions
     */
    allocate(resources) {

        /**
         *
         * @type {Map<ResourceAllocationBid, TacticalModule>}
         */
        const bids = new Map();

        const moduleResults = this.modules.map(m => {
            const promise = m.collectBids(resources);

            assert.notEqual(promise, undefined, 'promise is undefined');
            assert.notEqual(promise, null, 'promise is null');
            assert.typeOf(promise.then, 'function', "promise.then");

            promise.then(moduleBids => {

                assert.ok(Array.isArray(moduleBids), `moduleBids expected to be an array, was something else (typeof='${typeof moduleBids}')`);

                moduleBids.forEach(b => bids.set(b, m));

            });

            return promise;
        });


        return Promise.all(moduleResults)
            .then(() => {
                /**
                 *
                 * @type {ResourceAllocationSolver}
                 */
                const solver = new ResourceAllocationSolver();

                //set resources
                solver.addResources(resources);
                //set bids
                bids.forEach((m, b) => solver.addBid(b));

                /**
                 *
                 * @type {ResourceAllocationBid[]}
                 */
                const allocations = solver.solve();

                return allocations.map(a => a.actions).flat();
            });
    }
}
