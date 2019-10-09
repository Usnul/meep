/**
 * Created by Alex on 14/06/2017.
 */


import Vector3 from "../../../core/geom/Vector3";
import Vector4 from "../../../core/geom/Vector4";

function Trail2D(options) {
    this.maxAge = 5;
    this.textureURL = null;
    this.width = 1;
    this.color = new Vector4(1, 1, 1, 1);
    this.offset = new Vector3();

    if (options !== undefined) {
        this.fromJSON(options);
    }
}

Trail2D.typeName = "Trail2D";

Trail2D.prototype.fromJSON = function (json) {
    if (typeof json.maxAge === "number") {
        this.maxAge = json.maxAge;
    }

    if (typeof json.width === "number") {
        this.width = json.width;
    }

    if (typeof json.textureURL === "string") {
        this.textureURL = json.textureURL;
    }

    if (json.offset !== undefined) {
        this.offset.fromJSON(json.offset);
    }

    if (json.color !== undefined) {
        this.color.fromJSON(json.color);
    }
};

Trail2D.prototype.toJSON = function () {
    return {
        maxAge: this.maxAge,
        width: this.width,
        color: this.color.toJSON(),
        textureURL: this.textureURL,
        offset: this.offset.toJSON()
    };
};

Trail2D.serializable = false;

export default Trail2D;
