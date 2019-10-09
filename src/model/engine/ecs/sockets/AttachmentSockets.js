import List from "../../../core/collection/List.js";
import { AttachmentSocket } from "./AttachmentSocket.js";
import { AttachmentSocketType } from "./AttachmentSocketType.js";
import { BoneAttachmentSocket } from "./BoneAttachmentSocket.js";

export class AttachmentSockets {
    constructor() {
        /**
         *
         * @type {List<AttachmentSocket>}
         */
        this.elements = new List();
    }

    /**
     *
     * @param {String} id Socket id
     * @returns {AttachmentSocket|undefined}
     */
    get(id) {
        return this.elements.find(s => s.id === id);
    }

    /**
     *
     * @param {AttachmentSocket} socket
     */
    add(socket) {
        this.elements.add(socket);
    }

    fromJSON({ elements }) {

        const sockets = elements.map(AttachmentSockets.fromSocketJSON);

        this.elements.reset();
        this.elements.addAll(sockets);
    }

    /**
     *
     * @param e
     * @returns {BoneAttachmentSocket|AttachmentSocket}
     */
    static fromSocketJSON(e) {
        if (e.type === AttachmentSocketType.Transform) {
            return AttachmentSocket.fromJSON(e);
        } else {
            return BoneAttachmentSocket.fromJSON(e);
        }
    }

    /**
     *
     * @param j
     * @returns {AttachmentSockets}
     */
    static fromJSON(j) {
        const r = new AttachmentSockets();

        r.fromJSON(j);

        return r;
    }
}

AttachmentSockets.serializable = false;

AttachmentSockets.typeName = "AttachmentSockets";
