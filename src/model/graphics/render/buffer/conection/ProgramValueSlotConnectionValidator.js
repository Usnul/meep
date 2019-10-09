import { ProgramValueDirectionKind } from "../slot/ProgramValueDirectionKind";

export class ProgramValueSlotConnectionValidator {
    constructor() {

    }

    /**
     *
     * @param {ProgramValueSlotConnection} connection
     */
    validate(connection) {

        const sourceEndpoint = connection.source;

        if (sourceEndpoint.slot.direction === ProgramValueDirectionKind.In) {
            //source slot must not be an input
            return false;
        }

        const targetEndpoint = connection.target;

        if (targetEndpoint.slot.direction === ProgramValueDirectionKind.Out) {
            //target slot must not be an output
            return false;
        }

        return true;
    }
}