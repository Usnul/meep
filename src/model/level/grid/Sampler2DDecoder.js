import Vector2 from "../../core/geom/Vector2";

const Sampler2DDecoder = function () {
    this.types = {};
};
Sampler2DDecoder.prototype.registerType = function (id, r, g, b, a) {
    this.types[id] = {
        r: r,
        g: g,
        b: b,
        a: a
    };
};
Sampler2DDecoder.prototype.decode = function (sampler2d) {
    const result = {};
    const types = this.types;
    //make a result container
    for (let id in  types) {
        if (types.hasOwnProperty(id)) {
            result[id] = [];
        }
    }
    const data = sampler2d.data;
    const dataWidth = sampler2d.width;

    function recordType(id, index) {
        const i4 = Math.floor(index / 4);
        const x = i4 % dataWidth;
        const y = Math.floor(i4 / dataWidth);

        result[id].push(new Vector2(x, y));
    }

    //iterate over pixels
    //TODO this can be optimized in the future using code generation and early bailouts
    let i = 0;
    const l = data.length;
    for (; i < l; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        for (let typeId in types) {
            if (!types.hasOwnProperty(typeId)) {
                continue;
            }
            const type = types[typeId];
            if (type.r === r && type.g === g && type.b === b && type.a === a) {
                //type match
                recordType(typeId, i);
                break;
            }
        }
    }
    return result;
};
export default Sampler2DDecoder;