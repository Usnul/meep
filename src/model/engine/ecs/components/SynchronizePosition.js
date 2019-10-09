/**
 * Created by Alex on 05/02/2015.
 */
function SynchronizePosition(options) {
    this.targetEntity = options.targetEntity;
    this.x = options.x !== void 0 ? options.x : true;
    this.y = options.y !== void 0 ? options.y : true;
    this.z = options.z !== void 0 ? options.z : true;
}

SynchronizePosition.typeName = "SynchronizePosition";

SynchronizePosition.serializable = false;

export default SynchronizePosition;
