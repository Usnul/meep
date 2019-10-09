/**
 * Module is responsible for generating a set of bids given some resources
 * @template RT
 */
export class TacticalModule {
    /**
     *
     * @param {Resource<RT>[]} resources
     * @returns {Promise<ResourceAllocationBid[]>}
     */
    collectBids(resources) {
        throw new Error('Method needs to be overridden');
    }
}
