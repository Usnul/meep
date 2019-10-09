import { Process, ProcessState } from "./Process.js";
import List from "../../core/collection/List.js";

/**
 *
 * @param {Editor} editor
 * @param {Process} process
 */
function tryInitialize(editor, process) {
    if (process.state.getValue() !== ProcessState.New) {
        //process already initialized, ignore
        return;
    }

    try {
        process.initialize(editor);
    } catch (e) {
        console.error(`Failed to initialize process (name='${process.name}'):`, e);
    }
}

class ProcessEngine extends Process {
    constructor() {
        super();
        /**
         * @type {List.<Process>}
         */
        this.processes = new List();

        this.__suspendedList = new List();
    }

    startup() {
        super.startup();
        const editor = this.editor;

        this.processes.forEach(function (proc) {
            tryInitialize(editor, proc);
        });

        //re-start suspended processes
        this.__suspendedList.forEach(function (process) {
            process.startup();
        });

        this.__suspendedList.reset();
    }

    /**
     *
     * @param {Process} process
     */
    add(process) {
        this.processes.add(process);

        if (this.state.getValue() !== ProcessState.New && this.state.getValue() !== ProcessState.Stopped) {
            tryInitialize(this.editor, process);
        }
    }

    shutdown() {
        const self = this;
        //shutdown any running processes
        this.processes.forEach(function (process) {
            if (process.state.getValue() === ProcessState.Running) {
                process.shutdown();
                //record process as suspended
                self.__suspendedList.add(process);
            }
        });
        super.shutdown();
    }

    /**
     * @private
     * @param {Process} process
     */
    startProcess(process) {
        if (process.state.getValue() !== ProcessState.Running) {
            if (this.state.getValue() !== ProcessState.Running) {
                //record as suspended
                this.__suspendedList.add(process);
            } else {
                process.startup();
            }
        }
    }

    /**
     *
     * @param {string} name
     */
    startByName(name) {
        const process = this.processes.find(p => p.name === name);

        if (process === undefined) {
            console.error(`No process found by name '${name}'`);
            return;
        }

        this.startProcess(process);
    }

    /**
     *
     * @param {string} name
     */
    stopByName(name) {
        const process = this.processes.find(p => p.name === name);

        if (process === undefined) {
            console.error(`No process found by name '${name}'`);
            return;
        }

        if (process.state.getValue() === ProcessState.Running) {
            process.shutdown();
        }
    }
}

export { ProcessEngine };