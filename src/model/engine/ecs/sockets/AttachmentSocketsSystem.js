import { System } from "../System.js";
import { AttachmentSockets } from "./AttachmentSockets.js";

export class AttachmentSocketsSystem extends System {
    constructor() {
        super();

        this.componentClass = AttachmentSockets;
    }
}
