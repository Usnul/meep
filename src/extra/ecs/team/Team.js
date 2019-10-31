/**
 * Created by Alex on 13/04/2016.
 */


import ObservedInteger from "../../../model/core/model/ObservedInteger.js";
import { BinaryClassSerializationAdapter } from "../../../model/engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 * Abstraction to represent affiliation of an entity in the game
 * @example enemy team and allied team
 */
export class Team extends ObservedInteger {
    /**
     *
     * @param {number} [value]
     * @constructor
     */
    constructor(value = 0) {
        super(value);
    }

    clone() {
        return new Team(this.getValue());
    }

    /**
     *
     * @param {object} json
     * @returns {Team}
     */
    static fromJSON(json) {
        const t = new Team();

        t.fromJSON(json);

        return t;
    }
}

Team.typeName = "Team";


export class TeamSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Team;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Team} value
     */
    serialize(buffer, value) {
        const v = value.getValue();

        if (v === Infinity) {
            buffer.writeInt32(2147483647);
        } else if (v === -Infinity) {
            buffer.writeInt32(-2147483648);
        } else {
            //TODO it's possible to write encoded Infinity values by accident
            buffer.writeInt32(v);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Team} value
     */
    deserialize(buffer, value) {
        const v = buffer.readInt32();

        if (v === 2147483647) {
            value.set(Infinity);
        } else if (v === -2147483648) {
            value.set(-Infinity);
        } else {
            value.set(v);
        }
    }
}
