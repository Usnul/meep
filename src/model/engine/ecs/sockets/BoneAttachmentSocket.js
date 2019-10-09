import { AttachmentSocket } from "./AttachmentSocket.js";

/**
 * @extends {AttachmentSocket}
 */
export class BoneAttachmentSocket extends AttachmentSocket {
    constructor() {
        super();

        this.boneName = "";
    }

    fromJSON(j) {
        super.fromJSON(j);

        this.boneName = j.boneName;
    }

    /**
     *
     * @param j
     * @returns {BoneAttachmentSocket}
     */
    static fromJSON(j) {
        const r = new BoneAttachmentSocket();

        r.fromJSON(j);

        return r;
    }
}


/**
 * @readonly
 * @type {boolean}
 */
BoneAttachmentSocket.prototype.isBoneAttachmentSocket = true;
