import { WebGLRenderTarget } from "three";
import { RenderTargetParameters } from "../slot/parameter/RenderTargetParameters.js";

/**
 *
 * @param {ProgramValueSlotParameterSet} parameters
 * @returns {WebGLRenderTarget}
 */
function makeRenderTarget(parameters) {
    const options = {};

    const pFormat = parameters.getParameterByName(RenderTargetParameters.Format);

    if (pFormat !== undefined) {
        options.format = pFormat.value;
    }

    const pDataType = parameters.getParameterByName(RenderTargetParameters.DataType);

    if (pDataType !== undefined) {
        options.type = pDataType.value;
    }

    const pEncoding = parameters.getParameterByName(RenderTargetParameters.Encoding);

    if (pEncoding !== undefined) {
        options.encoding = pEncoding.value;
    }

    const result = new WebGLRenderTarget(0, 0, options);

    return result;
}

class PoolEntry {
    /**
     *
     * @param {ProgramValueSlotParameterSet} parameters
     * @param {number} parametersHash
     */
    constructor({ parameters, parametersHash }) {
        this.inUse = false;
        /**
         *
         * @type {ProgramValueSlotParameterSet}
         */
        this.parameters = parameters;
        this.parametersHash = parametersHash;
        /**
         *
         * @type {WebGLRenderTarget}
         */
        this.buffer = makeRenderTarget(parameters);
    }
}


export class FrameBufferPool {
    constructor() {
        /**
         *
         * @type {PoolEntry[]}
         */
        this.buffers = [];
    }

    /**
     *
     * @param {ProgramValueSlotParameterSet} parameters
     * @returns {WebGLRenderTarget}
     */
    get(parameters) {
        //compute hash
        const parametersHash = parameters.hash();

        //try to find one
        let poolEntry = this.buffers.find(e => !e.inUse && e.parametersHash === parametersHash);

        if (poolEntry === undefined) {
            //doesn't exist, make one
            poolEntry = new PoolEntry({ parameters, parametersHash });

        }

        //mark as being in use
        poolEntry.inUse = true;

        return poolEntry.buffer;
    }

    /**
     *
     * @param {WebGLRenderTarget} buffer
     * @returns {boolean}
     */
    release(buffer) {
        for (let i = 0; i < this.buffers.length; i++) {
            const poolEntry = this.buffers[i];

            if (poolEntry.buffer === buffer) {
                if (poolEntry.inUse === false) {
                    console.error('Attempting to release buffer that is not registered as being in use', poolEntry);
                    return false;
                }

                poolEntry.inUse = false;
                return true;
            }
        }

        console.error('Attempted to release buffer that is not registered');
        return false;
    }

    reset() {
        while (this.buffers.length > 0) {
            const poolEntry = this.buffers.pop();
            //release resources
            poolEntry.buffer.dispose()
        }
    }

    destroy() {
        //release all render targets
        this.buffers.forEach(e => e.buffer.dispose());
    }
}