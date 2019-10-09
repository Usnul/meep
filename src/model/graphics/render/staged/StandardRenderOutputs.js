import { ProgramValueSlotDefinition } from "../buffer/slot/ProgramValueSlotDefinition.js";
import { ProgramValueDirectionKind } from "../buffer/slot/ProgramValueDirectionKind.js";
import { ProgramValueType } from "../buffer/slot/ProgramValueType.js";

/**
 *
 * @enum {ProgramValueSlotDefinition}
 */
export const StandardRenderOutputs = {
    DepthBuffer: new ProgramValueSlotDefinition({
        name: 'output',
        direction: ProgramValueDirectionKind.Out,
        type: ProgramValueType.FrameBuffer
    }),
    ColorBuffer: new ProgramValueSlotDefinition({
        name: 'output',
        direction: ProgramValueDirectionKind.Out,
        type: ProgramValueType.FrameBuffer
    })
};