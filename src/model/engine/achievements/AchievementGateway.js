/**
 * Base class for implementing achievement system API connectors
 */
export class AchievementGateway {
    constructor() {

    }

    /**
     * Retrieve list of unlocked achievements
     * @returns {Promise<String[]>} IDs of unlocked achievements
     */
    getUnlocked() {
        //needs to be overridden in subclass
        throw new Error('Not implemented');
    }

    /**
     * Unlock an achievements by ID
     * @param {String} id
     * @returns {Promise}
     */
    unlock(id) {
        //needs to be overridden in subclass
        throw new Error('Not implemented');
    }
}
