import ObservedString from "../../../model/core/model/ObservedString.js";
import { BinaryClassSerializationAdapter } from "../../../model/engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 * Component for giving localized names to entities,
 * @example useful when you want to display visual names above enemies in your game
 */
export class Name extends ObservedString {
    /**
     *
     * @param {string} [value] Optional initial value for name
     */
    constructor(value = "") {
        super(value);
    }

    /**
     *
     * @returns {string}
     */
    getLocalizationKey() {
        return `component.name.${this.getValue()}`;
    }

    /**
     *
     * @param {Localization} localization
     * @returns {string}
     */
    getLocalizedValue(localization) {
        return localization.getString(this.getLocalizationKey());
    }

    clone() {
        const clone = new Name();

        clone.copy(this);

        return clone;
    }
}

Name.typeName = "Name";

export class NameSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Name;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Name} value
     */
    serialize(buffer, value) {
        buffer.writeUTF8String(value.getValue());
    }


    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Name} value
     */
    deserialize(buffer, value) {
        const str = buffer.readUTF8String();

        value.set(str);
    }
}
