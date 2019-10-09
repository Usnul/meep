/**
 * Created by Alex on 13/04/2016.
 */
import ObservedInteger from "../../../core/model/ObservedInteger.js";
import { BinaryClassSerializationAdapter } from "../../../engine/ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 *
 * @param value
 * @constructor
 */
function Team(value = 0) {
    ObservedInteger.call(this, value);
}

Team.typeName = "Team";

Team.prototype = Object.create(ObservedInteger.prototype);

Team.prototype.constructor = Team;

/**
 *
 * @param {object} json
 * @returns {Team}
 */
Team.fromJSON = function (json) {
    const t = new Team();

    t.fromJSON(json);

    return t;
};

Team.prototype.clone = function () {
    return new Team(this.getValue());
};

export default Team;

export class TeamSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
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
