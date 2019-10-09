import ObservedEnum from "../../core/model/ObservedEnum.js";

/**
 *
 * @enum {string}
 */
const ProcessState = {
    New: "new",
    Initialized: "initialized",
    Running: "running",
    Stopped: "stopped"
};

class Process {

    constructor() {
        /**
         *
         * @type {string}
         */
        this.name = "unnamed";
        /**
         *
         * @type {ObservedEnum.<ProcessState>}
         */
        this.state = new ObservedEnum(ProcessState.New, ProcessState);
        /**
         *
         * @type {Editor|null}
         */
        this.editor = null;
    }

    /**
     *
     * @param {Editor} editor
     */
    initialize(editor) {
        this.editor = editor;
        this.state.set(ProcessState.Initialized);
    }

    startup() {
        this.state.set(ProcessState.Running);
    }

    shutdown() {
        this.state.set(ProcessState.Stopped);
    }
}

export { Process, ProcessState };