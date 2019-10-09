/**
 * Created by Alex Goldring on 21.02.2015.
 */

import Vector3 from "../../../core/geom/Vector3";

const Trail = function (options) {
    if (options === undefined) {
        options = {};
    }

    this.lifetime = options.lifetime !== void 0 ? options.lifetime : 5;
    this.textureURL = options.textureURL;

    this.startColor = options.startColor !== void 0 ? options.startColor : 0xFFFFFF;
    this.endColor = options.endColor !== void 0 ? options.endColor : 0xFFFFFF;

    this.startOpacity = options.startOpacity !== void 0 ? options.startOpacity : 1;
    this.endOpacity = options.endOpacity !== void 0 ? options.endOpacity : 1;

    this.startWidth = options.startWidth !== void 0 ? options.startWidth : 1;
    this.endWidth = options.endWidth !== void 0 ? options.endWidth : 1;

    this.rotation = 0;

    this.offset = new Vector3();
};

Trail.typeName = 'Trail';

Trail.prototype.toJSON = function () {
    return {
        lifetime: this.lifetime,
        textureURL: this.textureURL,
        startColor: this.startColor,
        endColor: this.endColor,
        startOpacity: this.startOpacity,
        endOpacity: this.endOpacity,
        startWidth: this.startWidth,
        endWidth: this.endWidth
    };
};

Trail.prototype.fromJSON = function (json) {
    if (typeof json.lifetime === "number") {
        this.lifetime = json.lifetime;
    }

    if (typeof json.textureURL === "string") {
        this.textureURL = json.textureURL;
    }

    if (typeof json.startColor === "number") {
        this.startColor = json.startColor;
    }
    if (typeof json.endColor === "number") {
        this.endColor = json.endColor;
    }

    if (typeof json.startOpacity === "number") {
        this.startOpacity = json.startOpacity;
    }
    if (typeof json.endOpacity === "number") {
        this.endOpacity = json.endOpacity;
    }

    if (typeof json.startWidth === "number") {
        this.startWidth = json.startWidth;
    }
    if (typeof json.endWidth === "number") {
        this.endWidth = json.endWidth;
    } else {
        this.endWidth = this.startWidth;
    }

    if (json.offset !== undefined) {
        this.offset.fromJSON(json.offset);
    }
};

Trail.serializable = false;

export default Trail;
