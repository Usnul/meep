import Vector3 from "../../../core/geom/Vector3.js";

/**
 * Component representing attachment to another entity
 * @constructor
 */
function ParentEntity() {
    this.entity = -1;
    this.positionOffset = new Vector3(0, 0, 0);
}

ParentEntity.typeName = "ParentEntity";

ParentEntity.prototype.toJSON = function () {
    return {
        entity: this.entity,
        positionOffset: this.positionOffset.toJSON()
    };
};

ParentEntity.prototype.fromJSON = function (json) {
    this.entity = json.entity;
    this.positionOffset.fromJSON(json.positionOffset);
};

export { ParentEntity };