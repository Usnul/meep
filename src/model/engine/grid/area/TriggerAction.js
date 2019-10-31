import { TriggerActionType } from "./TriggerActionType.js";

export class TriggerAction {
    constructor() {
        this.type = TriggerActionType.Unknown;
        this.parameters = [];
    }
}
