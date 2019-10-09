import { assert } from "../../../core/assert.js";

export class ResourceAllocationSolver {
    constructor() {
        /**
         *
         * @type {Map<any,Resource>}
         * @private
         */
        this.resources = new Map();

        /**
         *
         * @type {ResourceAllocationBid[]}
         * @private
         */
        this.bids = [];

        /**
         *
         * @type {ResourceAllocationBid[]}
         * @private
         */
        this.allocations = [];
    }

    clear() {
        this.resources.clear();
        this.bids = [];
        this.allocations = [];
    }

    /**
     *
     * @param {Resource[]} resources
     */
    addResources(resources) {
        resources.forEach(r => this.addResource(r));
    }

    /**
     *
     * @param {Resource} resource
     */
    addResource(resource) {
        const type = resource.type;

        const existingResource = this.resources.get(type);

        if (existingResource === undefined) {
            this.resources.set(type, resource);
        } else {
            existingResource.amount += resource.amount;
        }
    }

    /**
     *
     * @param {ResourceAllocationBid[]} bids
     */
    addBids(bids) {
        bids.forEach(b => this.addBid(b));
    }

    /**
     *
     * @param {ResourceAllocationBid} bid
     */
    addBid(bid) {
        assert.ok(bid.value >= 0 && bid.value <= 1, `expected 0 >= value <= 1, instead got '${bid.value}'`);

        this.bids.push(bid);
    }


    /**
     * The problem is that of dynamic programming. Often called "knapsack problem" we want to assign resources in the best possible way
     * TODO: the algorithm is very greedy, there is a lot of room for optimization
     * @returns {ResourceAllocationBid[]}
     */
    solve() {
        /**
         *
         * @type {Map<any, Resource>}
         */
        const availableResources = new Map();

        //populate lookup map
        this.resources.forEach((r, type) => {
            const resource = r.clone();

            availableResources.set(type, resource);
        });

        //make a copy of bids to preserve original before sorting
        const bids = this.bids.slice();

        //sort bids by value
        bids.sort((a, b) => {
            const v0 = a.value * a.weight;
            const v1 = b.value * b.weight;

            return v1 - v0;
        });

        /**
         *
         * @param {ResourceAllocationBid} bid
         */
        function assignResources(bid) {
            const allocation = bid.allocation;

            const bidResources = allocation.resources;

            //check if resources are there
            for (const bidResource of bidResources) {
                const resource = availableResources.get(bidResource.type);

                if (resource === undefined) {
                    //resource doesn't exist
                    return false;
                }

                if (resource.amount < bidResource.amount) {
                    //insufficient resource
                    return false;
                }
            }

            //assign the resources
            for (const bidResource of bidResources) {
                const resource = availableResources.get(bidResource.type);

                resource.amount -= bidResource.amount;
            }


            return true;
        }


        //assign bids
        this.allocations = [];
        bids.forEach(b => {
            const success = assignResources(b);
            if (success) {
                this.allocations.push(b);
            }
        });


        return this.allocations;
    }

}