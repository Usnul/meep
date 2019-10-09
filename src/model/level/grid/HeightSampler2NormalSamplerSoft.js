/**
 * Created by Alex on 15/11/2014.
 */
import * as THREE from 'three';
import { Sampler2D } from '../../graphics/texture/sampler/Sampler2D';


const sqrt2 = 1.41421356237;

function convert(heightSampler) {
    function getValue(x, y) {
        const h = heightSampler.get(x, y);
        if (h === void 0) {
            return 0;
        }
        return h;
    }

    function setNormal(x, y, result) {
        const current = getValue(x, y);
        //
        const top = getValue(x, y - 1);
        const bottom = getValue(x, y + 1);
        const left = getValue(x - 1, y);
        const right = getValue(x + 1, y);
        //
        const topLeft = getValue(x - 1, y - 1);
        const topRight = getValue(x + 1, y - 1);
        const bottomLeft = getValue(x - 1, y + 1);
        const bottomRight = getValue(x + 1, y + 1);
        //
        let xm = (right - current) + (current - left) + (topRight - current) / sqrt2 + (current - topLeft) / sqrt2 + (bottomRight - current) / sqrt2 + (current - bottomLeft) / sqrt2;
        let ym = (bottom - current) + (current - top) + (bottomLeft - current) / sqrt2 + (bottomRight - current) / sqrt2 + (current - topLeft) / sqrt2 + (current - topRight) / sqrt2;
        if (Number.isNaN(xm)) {
            xm = 0;
        }
        if (Number.isNaN(ym)) {
            ym = 0;
        }
        xm /= 6;
        ym /= 6;
        const f = Math.sqrt(xm * xm + ym * ym);
        const a = Math.acos(f % 1);
        const d = Math.sin(a);
        result.set(xm, ym, d);
        result.normalize();
    }

    //
    const height = heightSampler.height;
    const width = heightSampler.width;
    const data = new Float32Array(width * height * 3);
    const v3 = new THREE.Vector3();
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const i = (x + y * width);
            const j = i * 3;
            setNormal(x, y, v3);
            data[j] = v3.x;
            data[j + 1] = v3.y;
            data[j + 2] = v3.z;
        }
    }
    return new Sampler2D(data, 3, width, height);
}

export default convert;
