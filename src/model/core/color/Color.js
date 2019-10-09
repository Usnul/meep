import Signal from "../events/signal/Signal.js";
import { hsv2rgb, parseColor } from "./ColorUtils.js";

class Color {
    /**
     *
     * @param {number} r value from 0 to 1
     * @param {number} g value from 0 to 1
     * @param {number} b value from 0 to 1
     */
    constructor(r = 0, g = 0, b = 0) {
        this.r = r;
        this.g = g;
        this.b = b;

        this.onChanged = new Signal();
    }

    /**
     *
     * @param {number} r
     * @param {number} g
     * @param {number} b
     */
    setRGB(r, g, b) {
        const _r = this.r;
        const _g = this.g;
        const _b = this.b;

        this.r = r;
        this.g = g;
        this.b = b;

        this.onChanged.dispatch(r, g, b, _r, _g, _b);
    }

    /**
     *
     * @param {number} h
     * @param {number} s
     * @param {number} v
     */
    setHSV(h, s, v) {
        const rgb = hsv2rgb(h, s, v);

        this.setRGB(rgb.r / 255, rgb.b / 255, rgb.b / 255);
    }

    /**
     *
     * @returns {number}
     */
    toUint() {
        const r = (this.r * 255) | 0;
        const g = (this.g * 255) | 0;
        const b = (this.b * 255) | 0;

        return b | g << 8 | r << 16;
    }

    /**
     *
     * @param {number} value
     */
    fromUint(value) {
        const r = value >> 16;
        const g = (value >> 8) & 0xFF;
        const b = (value) & 0xFF;

        this.setRGB(r / 255, g / 255, b / 255);
    }

    /**
     *
     * @param {Color} other
     */
    equals(other) {
        return this.r === other.r && this.g === other.g && this.b === other.b;
    }

    /**
     *
     * @param {Color} other
     */
    copy(other) {
        this.setRGB(this.r, this.g, this.b);
    }

    /**
     *
     * @returns {Color}
     */
    clone() {
        const result = new Color();

        result.copy(this);

        return result;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    toBinaryBuffer(buffer) {
        buffer.writeFloat32(this.r);
        buffer.writeFloat32(this.g);
        buffer.writeFloat32(this.b);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     */
    fromBinaryBuffer(buffer) {
        const r = buffer.readFloat32();
        const g = buffer.readFloat32();
        const b = buffer.readFloat32();

        this.setRGB(r, g, b);
    }
}

/**
 *
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {Color}
 */
Color.fromRGB = function (r, g, b) {
    return new Color(r, g, b);
};

Color.parse = function (str) {

    const c = parseColor(str);

    return new Color(c[0] / 255, c[1] / 255, c[2] / 255);
};

export { Color };
