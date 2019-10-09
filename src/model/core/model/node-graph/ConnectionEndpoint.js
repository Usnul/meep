export class ConnectionEndpoint {
    constructor() {
        /**
         *
         * @type {NodeInstance}
         */
        this.instance = null;
        /**
         *
         * @type {Port}
         */
        this.port = null;
    }

    /**
     *
     * @param {NodeInstance} instance
     * @param {Port} port
     */
    set(instance, port) {
        //TODO validate

        this.instance = instance;
        this.port = port;
    }
}
