import { noop } from "../../../../model/core/function/Functions.js";
import Signal from "../../../../model/core/events/signal/Signal.js";

export class Option {
    /**
     *
     * @param {string} id
     * @param {function} read
     * @param {function} [write]
     * @param {object} [settings]
     * @constructor
     */
    constructor(id, read, write = noop, settings = {
        transient: false
    }) {
        const self = this;

        function wrappedWrite(v) {
            const result = write(v);

            if (result !== undefined && typeof result.then === "function") {
                result.then(
                    () => self.on.written.dispatch(v),
                    (e) => self.on.writeFailed.dispatch(v, e)
                );
            } else {
                self.on.written.dispatch(v);
            }

            return result;
        }

        this.read = read;
        this.write = wrappedWrite;
        this.id = id;
        this.settings = settings;

        /**
         * Controls serialization. Transient options are not serialized
         * @type {boolean}
         */
        this.isTransient = (settings.transient === true);

        /**
         *
         * @type {OptionGroup|null}
         */
        this.parent = null;

        this.on = {
            written: new Signal(),
            writeFailed: new Signal()
        };
    }

    toJSON() {
        let v = this.read();
        switch (typeof v) {
            case "number":
            case "boolean":
            case "string":
                return v;
            default:
                return null;
        }
    }

    fromJSON(json) {
        this.write(json);
    }
}
