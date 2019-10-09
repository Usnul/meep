import Transform from "../components/Transform.js";

export class AttachmentSocket {
    constructor() {
        /**
         *
         * @type {String}
         */
        this.id = null;

        /**
         * Transform of the socket relative to the entity
         * @readonly
         * @type {Transform}
         */
        this.transform = new Transform();
    }

    fromJSON(j) {

        this.id = j.id;

        if (j.transform !== undefined) {
            this.transform.fromJSON(j.transform);
        }
    }

    /**
     *
     * @param j
     * @returns {AttachmentSocket}
     */
    static fromJSON(j) {
        const r = new AttachmentSocket();

        r.fromJSON(j);

        return r;
    }
}
